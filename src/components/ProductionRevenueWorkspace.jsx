import { useCallback, useEffect, useMemo, useState } from "react";
import { createRevenueRepository } from "../repositories/revenueRepository.js";
import { buildProductionCandidatePreview, candidateIdempotencyKey } from "../services/productionRevenueCandidate.js";

const money = (minor, currency = "JPY") =>
  new Intl.NumberFormat("ja-JP", { style: "currency", currency }).format(Number(minor || 0));

const laneLabel = { service:"Service", affiliate:"Affiliate", digital_product:"Digital Product", media:"Media" };
const workflowLabel = { owner_artifact_approval:"Owner artifact approval", manual_package_ready:"Manual package ready", evidence_waiting:"Evidence waiting" };
const destinationLabel = { email_draft:"Email draft (manual)", social_draft:"Social draft (manual)", owner_selected_service_channel:"Owner-selected service channel", owner_selected_manual_channel:"Owner-selected manual channel" };

export default function ProductionRevenueWorkspace({ ownerSupabaseClient }) {
  const repository = useMemo(() => createRevenueRepository(ownerSupabaseClient), [ownerSupabaseClient]);
  const preview = useMemo(buildProductionCandidatePreview, []);
  const [context, setContext] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [evidence, setEvidence] = useState({ sourceType: "invoice_paid", sourceReference: "", amountMinor: "", costAmountMinor: "0", currency: "JPY" });
  const [previewPackageId, setPreviewPackageId] = useState("");

  const refresh = useCallback(async () => {
    setError("");
    try {
      const nextContext = await repository.loadContext();
      const nextSnapshot = await repository.loadSnapshot(nextContext.workspace.id);
      setContext(nextContext);
      setSnapshot(nextSnapshot);
    } catch {
      setError("Remote repositoryを確認できません。Session・Migration 005・RLSを確認してください。");
    }
  }, [repository]);

  useEffect(() => { refresh(); }, [refresh]);

  const run = async (key, action, success) => {
    if (busy) return;
    setBusy(key); setError(""); setNotice("");
    try { await action(); setNotice(success); await refresh(); }
    catch { setError("操作はfail-closedで停止しました。入力・承認状態・Migration 005を確認してください。"); }
    finally { setBusy(""); }
  };

  const pending = snapshot?.approvals?.filter((item) => item.status === "pending") || [];
  const packages = snapshot?.executionPackages || [];
  const approvedWithoutPackage = (snapshot?.approvals || []).filter((approval) =>
    approval.scope === "internal_artifact" && approval.status === "approved" && !packages.some((item) => item.approval_request_id === approval.id));
  const previewPackage = packages.find((item) => item.id === previewPackageId);
  const totalActual = (snapshot?.revenue || []).reduce((sum, item) => sum + Number(item.net_amount_minor || 0), 0);

  const openPreview = (item) => run(`view:${item.id}`, async () => {
    await repository.recordManualPackageAccess(item.id, "viewed");
    setPreviewPackageId(item.id);
  }, "Manual Execution Packageの閲覧を監査ログへ記録しました。");

  const exportPackage = (item, action) => run(`${action}:${item.id}`, async () => {
    const content = JSON.stringify(item.payload_snapshot, null, 2);
    if (action === "copied") await navigator.clipboard.writeText(content);
    else {
      const blob = new Blob([content], { type:"application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a"); anchor.href=url; anchor.download=`kevirio-manual-package-${item.id}.json`; anchor.click();
      URL.revokeObjectURL(url);
    }
    await repository.recordManualPackageAccess(item.id, action);
  }, action === "copied" ? "Packageをコピーしました。外部送信は実行していません。" : "Packageをダウンロードしました。外部送信は実行していません。");

  return (
    <main className="content production-revenue">
      <section className="production-hero">
        <div>
          <span className="eyebrow">PRODUCTION REVENUE REPOSITORY</span>
          <h1>OpportunityからActual Revenueまで、証跡を切らさない。</h1>
          <p>Supabaseを唯一の正本として使用します。外部実行は常にロックされ、ActualはOwner承認済みEvidenceからのみ生成されます。</p>
        </div>
        <div className="boundary-card">
          <strong>SECURITY BOUNDARY</strong>
          <span>OWNER SESSION · RLS · RPC</span>
          <span className="lock-status">External execution: LOCKED</span>
        </div>
      </section>

      {error && <div className="production-alert danger" role="alert">{error}</div>}
      {notice && <div className="production-alert success" role="status">{notice}</div>}

      <section className="production-kpis">
        <article><span>Workspace</span><strong>{context?.workspace?.name || "Remote確認中"}</strong><small>{context?.brand?.name || "—"}</small></article>
        <article><span>Campaigns</span><strong>{snapshot?.campaigns?.length ?? "—"}</strong><small>Supabase canonical</small></article>
        <article><span>Pending approvals</span><strong>{pending.length}</strong><small>Owner decision required</small></article>
        <article><span>Verified net actual</span><strong>{money(totalActual)}</strong><small>Evidence-backed only</small></article>
      </section>

      <section className="production-grid">
        <article className="production-panel featured">
          <div className="panel-heading"><div><span className="eyebrow">RECOMMENDED OPPORTUNITY</span><h2>{preview.title}</h2></div><span className="mode-badge">MOCK / FORECAST</span></div>
          <p>{preview.summary}</p>
          <div className="fact-grid">
            <div><span>Score</span><strong>{preview.scoreSnapshot.finalScore}</strong></div>
            <div><span>Forecast</span><strong>{money(preview.forecastRevenueMinor)}</strong></div>
            <div><span>Cost forecast</span><strong>{money(preview.forecastCostMinor)}</strong></div>
            <div><span>Lane</span><strong>{laneLabel[preview.lane] || "Manual"}</strong></div>
          </div>
          <button className="production-primary" disabled={Boolean(busy) || !context} onClick={() => run("candidate",
            () => repository.createRevenueCandidate(context.workspace.id, context.brand.id, candidateIdempotencyKey(preview), preview),
            "Production candidateを保存し、WorkflowをOwner承認待ちで停止しました。")}>
            {busy === "candidate" ? "保存中…" : "Production candidateを作成"}
          </button>
        </article>

        <article className="production-panel">
          <div className="panel-heading"><div><span className="eyebrow">APPROVAL QUEUE</span><h2>Owner Review</h2></div><strong>{pending.length}</strong></div>
          {pending.length === 0 ? <p className="empty-copy">承認待ちはありません。</p> : pending.map((item) => (
            <div className="approval-row" key={item.id}>
              <div><strong>Internal artifact review</strong><small>{item.id.slice(0, 8)} · snapshot固定</small></div>
              <button disabled={Boolean(busy)} onClick={() => run(`approve:${item.id}`,
                () => repository.decideApproval(item.id, "approve", "Owner verified the immutable preview snapshot.", item.preview_snapshot),
                "Owner承認とManual Execution Package生成を監査ログへ記録しました。")}>承認してPackage生成</button>
            </div>
          ))}
          {approvedWithoutPackage.map((item) => <div className="approval-row" key={item.id}>
            <div><strong>Approved · Package未生成</strong><small>既存承認のsnapshotを再検証して生成します</small></div>
            <button disabled={Boolean(busy)} onClick={() => run(`generate:${item.id}`, () => repository.generateManualPackage(item.id), "Manual Execution Packageを冪等に生成しました。")}>
              Package生成
            </button>
          </div>)}
        </article>

        <article className="production-panel featured manual-package-panel">
          <div className="panel-heading"><div><span className="eyebrow">NEXT OWNER ACTION</span><h2>Manual Execution Package</h2></div><span className="lock-chip">外部実行はロック中</span></div>
          {!packages.length && <p className="empty-copy">Artifact承認後、送信を伴わない手動実行Packageがここに表示されます。</p>}
          {packages.map((item) => {
            const payload=item.payload_snapshot || {};
            return <div className="manual-package-row" key={item.id}>
              <div><strong>{payload.campaign?.title || "Manual campaign package"}</strong><small>{laneLabel[payload.lane] || "Manual"} · {destinationLabel[payload.destinationType] || "Owner-selected destination"} · Artifact v{item.artifact_version}</small></div>
              <div className="manual-package-actions"><button onClick={() => openPreview(item)}>Preview</button><button onClick={() => exportPackage(item,"copied")}>Copy</button><button onClick={() => exportPackage(item,"downloaded")}>Download</button></div>
            </div>;
          })}
          {previewPackage && <div className="package-preview" role="region" aria-label="Manual Execution Package preview">
            <div className="panel-heading"><h3>Owner Preview</h3><button className="text-button" onClick={() => setPreviewPackageId("")}>閉じる</button></div>
            <dl>
              <div><dt>Workspace / Brand</dt><dd>{previewPackage.payload_snapshot.workspace?.name} / {previewPackage.payload_snapshot.brand?.name}</dd></div>
              <div><dt>Campaign</dt><dd>{previewPackage.payload_snapshot.campaign?.title}</dd></div>
              <div><dt>Lane / Destination</dt><dd>{laneLabel[previewPackage.payload_snapshot.lane] || "Manual"} / {destinationLabel[previewPackage.payload_snapshot.destinationType] || "Owner-selected destination"}</dd></div>
              <div><dt>Artifact / Approval</dt><dd>Version {previewPackage.artifact_version} / Snapshot verified</dd></div>
              <div><dt>Owner action</dt><dd>{previewPackage.payload_snapshot.ownerAction}</dd></div>
              <div><dt>Execution boundary</dt><dd>手動操作のみ · KEVIRIOから外部送信しません</dd></div>
            </dl>
          </div>}
        </article>

        <article className="production-panel">
          <div className="panel-heading"><div><span className="eyebrow">EVIDENCE INBOX</span><h2>Actual候補を登録</h2></div><span className="mode-badge actual">ACTUAL GATE</span></div>
          <label>Campaign
            <select id="evidence-campaign" disabled={Boolean(busy)} defaultValue="">
              <option value="" disabled>選択してください</option>
              {(snapshot?.campaigns || []).filter((item) => packages.some((value) => value.campaign_id === item.id)).map((item) => <option key={item.id} value={item.id}>{item.offer?.title || item.id.slice(0, 8)} · Evidence registration ready</option>)}
            </select>
          </label>
          <label>Evidence reference<input value={evidence.sourceReference} onChange={(event) => setEvidence({...evidence, sourceReference:event.target.value})} placeholder="Invoice / bank reference" /></label>
          <div className="evidence-fields">
            <label>Gross (minor)<input inputMode="numeric" value={evidence.amountMinor} onChange={(event) => setEvidence({...evidence, amountMinor:event.target.value})} /></label>
            <label>Cost (minor)<input inputMode="numeric" value={evidence.costAmountMinor} onChange={(event) => setEvidence({...evidence, costAmountMinor:event.target.value})} /></label>
          </div>
          <button className="production-secondary" disabled={Boolean(busy) || !evidence.sourceReference || !evidence.amountMinor} onClick={() => {
            const campaignId = document.getElementById("evidence-campaign")?.value;
            if (!campaignId) { setError("Campaignを選択してください。"); return; }
            run("evidence", () => repository.registerEvidence(context.workspace.id, campaignId, {
              ...evidence, amountMinor:Number(evidence.amountMinor), costAmountMinor:Number(evidence.costAmountMinor),
              occurredAt:new Date().toISOString(),
            }), "Evidence候補を登録し、Actual Revenue承認待ちへ移動しました。");
          }}>{busy === "evidence" ? "登録中…" : "Evidence候補を登録"}</button>
          {(snapshot?.evidence || []).filter((item) => item.verification_status !== "verified").map((item) => {
            const campaign = snapshot?.campaigns?.find((value) => value.id === item.campaign_id);
            const approval = snapshot?.approvals?.find((value) => value.campaign_id === item.campaign_id && value.scope === "actual_revenue_verification" && value.status === "approved");
            return <div className="approval-row" key={item.id}>
              <div><strong>{money(item.amount_minor, item.currency)}</strong><small>{item.source_type} · {item.verification_status}</small></div>
              <button disabled={Boolean(busy) || !approval} title={approval ? "Owner承認済みEvidenceをActualへ確定" : "先にActual Revenue承認が必要"} onClick={() => run(`verify:${item.id}`,
                () => repository.verifyRevenue(item.id, item.brand_id || campaign?.brand_id, item.client_id || null, item.lane || campaign?.lane),
                "Evidenceを検証し、Actual Revenueを冪等に記録しました。")}>Actual確定</button>
            </div>;
          })}
        </article>

        <article className="production-panel">
          <div className="panel-heading"><div><span className="eyebrow">DURABLE STATE</span><h2>Remote workflow</h2></div><button className="text-button" onClick={refresh}>再取得</button></div>
          {(snapshot?.workflows || []).slice(0, 5).map((item) => (
            <div className="workflow-row" key={item.id}><span>Revenue workflow</span><strong>{workflowLabel[item.current_step] || "Preparing"}</strong><small>{item.current_step === "owner_artifact_approval" ? "Owner review required" : item.current_step === "manual_package_ready" ? "Preview or export manually" : "Register evidence to continue"}</small></div>
          ))}
          {!snapshot?.workflows?.length && <p className="empty-copy">Workflow runはまだありません。</p>}
        </article>
      </section>
    </main>
  );
}
