import { useCallback, useEffect, useMemo, useState } from "react";
import { createRevenueRepository } from "../repositories/revenueRepository.js";
import { buildProductionCandidatePreview, candidateIdempotencyKey } from "../services/productionRevenueCandidate.js";
import { formatRevenuePackageMarkdown, selectOwnerSafeRevenuePackage } from "../domain/manualRevenuePackage.js";
import { validateEvidenceRegistration } from "../domain/revenueEvidence.js";
import { Card, EnvironmentBadge, KpiCard, LoadingState, Money, PageHeader } from "../design-system/index.js";
import "./ProductionScreens.css";

const money = (minor, currency = "JPY") =>
  new Intl.NumberFormat("ja-JP", { style: "currency", currency }).format(Number(minor || 0));

const laneLabel = { service:"Service", affiliate:"Affiliate", digital_product:"Digital Product", media:"Media" };
const workflowLabel = { owner_artifact_approval:"Artifact承認待ち", manual_package_ready:"Revenue Package準備完了", evidence_waiting:"Evidence待ち", actual_revenue_approval:"Actual Revenue承認待ち", revenue_recorded:"Revenue記録完了" };
const destinationLabel = { email_draft:"Email draft (manual)", social_draft:"Social draft (manual)", owner_selected_service_channel:"Owner-selected service channel", owner_selected_manual_channel:"Owner-selected manual channel" };

export default function ProductionRevenueWorkspace({ ownerSupabaseClient, ownerSession }) {
  const repository = useMemo(() => createRevenueRepository(ownerSupabaseClient), [ownerSupabaseClient]);
  const preview = useMemo(buildProductionCandidatePreview, []);
  const [context, setContext] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [evidence, setEvidence] = useState({ sourceType:"invoice_paid",sourceReference:"",amountMinor:"",costAmountMinor:"0",currency:"JPY",occurredAt:new Date().toISOString().slice(0,10),note:"" });
  const [previewPackageId, setPreviewPackageId] = useState("");

  const refresh = useCallback(async () => {
    setError("");
    try {
      const nextContext = await repository.loadContext(ownerSession);
      const nextSnapshot = await repository.loadSnapshot(nextContext.workspace.id);
      setContext(nextContext);
      setSnapshot(nextSnapshot);
    } catch {
      setError("Remote repositoryを確認できません。通信状態とOwner Sessionを確認して再取得してください。");
    }
  }, [repository,ownerSession]);

  useEffect(() => { refresh(); }, [refresh]);

  const run = async (key, action, success) => {
    if (busy) return;
    setBusy(key); setError(""); setNotice("");
    try { await action(); setNotice(success); await refresh(); }
    catch { setError("操作を安全に停止しました。入力、承認状態、Migration 008の適用状況を確認してください。"); }
    finally { setBusy(""); }
  };

  const pending = snapshot?.approvals?.filter((item) => item.status === "pending") || [];
  const artifactPending = pending.filter((item)=>item.scope==="internal_artifact");
  const actualPending = pending.filter((item)=>item.scope==="actual_revenue_verification");
  const packages = snapshot?.executionPackages || [];
  const approvedWithoutPackage = (snapshot?.approvals || []).filter((approval) =>
    approval.scope === "internal_artifact" && approval.status === "approved" && !packages.some((item) => item.approval_request_id === approval.id));
  const previewPackage = packages.find((item) => item.id === previewPackageId);
  const totalActual = (snapshot?.revenue || []).reduce((sum, item) => sum + Number(item.net_amount_minor || 0), 0);
  const hasActual = Boolean(snapshot?.revenue?.length);

  const openPreview = (item) => run(`view:${item.id}`, async () => {
    await repository.recordManualPackageAccess(item.id, "viewed");
    setPreviewPackageId(item.id);
  }, "Manual Execution Packageの閲覧を監査ログへ記録しました。");

  const exportPackage = (item, action) => run(`${action}:${item.id}`, async () => {
    const content = action === "copied" ? formatRevenuePackageMarkdown(item.payload_snapshot) : JSON.stringify(selectOwnerSafeRevenuePackage(item.payload_snapshot), null, 2);
    if (action === "copied") await navigator.clipboard.writeText(content);
    else {
      const blob = new Blob([content], { type:"application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a"); anchor.href=url; anchor.download=`kevirio-manual-package-${item.id}.json`; anchor.click();
      URL.revokeObjectURL(url);
    }
    await repository.recordManualPackageAccess(item.id, action);
  }, action === "copied" ? "Packageをコピーしました。外部送信は実行していません。" : "Packageをダウンロードしました。外部送信は実行していません。");

  const downloadMarkdown=(item)=>run(`markdown:${item.id}`,async()=>{
    const blob=new Blob([formatRevenuePackageMarkdown(item.payload_snapshot)],{type:"text/markdown;charset=utf-8"});
    const url=URL.createObjectURL(blob);const anchor=document.createElement("a");anchor.href=url;anchor.download="kevirio-sales-proposal.md";anchor.click();URL.revokeObjectURL(url);
    await repository.recordManualPackageAccess(item.id,"downloaded");
  },"提案書Markdownをダウンロードしました。外部送信は実行していません。");

  return (
    <main className="content production-revenue kv-production-screen">
      <PageHeader title="Revenue" description="Actual, Forecast, Evidence, Campaigns and Manual Packages" actions={<EnvironmentBadge environment={context ? "production" : "locked"} />} />
      <Card variant="decision" className="kv-operation-boundary"><div><strong>Security boundary</strong><p>Owner Session · RLS · protected RPC</p></div><strong>External execution: LOCKED</strong></Card>

      {error && <div className="production-alert danger" role="alert">{error}</div>}
      {notice && <div className="production-alert success" role="status">{notice}</div>}
      {!snapshot && !error ? <LoadingState label="Loading Revenue" /> : null}

      <section className="kv-kpi-grid" aria-label="Revenue summary"><KpiCard label="Workspace" value={context?.workspace?.name} state={context ? "actual" : "unknown"} comparison={context?.brand?.name} /><KpiCard label="Campaigns" value={snapshot?.campaigns?.length} state={snapshot ? "actual" : "unknown"} comparison="Canonical repository" /><KpiCard label="Pending approvals" value={snapshot ? pending.length : null} state="pending" comparison="Owner decision required" /><KpiCard label="Verified net Actual" value={hasActual ? <Money value={totalActual} currency="JPY" kind="actual" evidenceVerified locale="ja-JP" /> : null} state={hasActual ? "actual" : "unknown"} comparison="Evidence-backed only" /></section>

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
          <div className="panel-heading"><div><span className="eyebrow">ARTIFACT APPROVAL</span><h2>Owner Review</h2></div><strong>{artifactPending.length}</strong></div>
          {artifactPending.length === 0 ? <p className="empty-copy">Artifactの承認待ちはありません。</p> : artifactPending.map((item) => (
            <div className="approval-row" key={item.id}>
              <div><strong>Revenue Package内容確認</strong><small>承認対象のSnapshotは固定されています</small></div>
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
          <div className="panel-heading"><div><span className="eyebrow">NEXT OWNER ACTION</span><h2>手動営業 Revenue Package</h2></div><span className="lock-chip">Mock / Forecast · 外部実行ロック中</span></div>
          {!packages.length && <p className="empty-copy">Artifact承認後、送信を伴わない手動実行Packageがここに表示されます。</p>}
          {packages.map((item) => {
            const payload=item.payload_snapshot || {};
            return <div className="manual-package-row" key={item.id}>
              <div><strong>{payload.campaignTitle || "小規模事業者向けSNS・記事制作支援 提案"}</strong><small>{payload.serviceName} · {laneLabel[payload.lane] || "手動営業"}</small></div>
              <div className="manual-package-actions"><button onClick={() => openPreview(item)}>内容を確認</button><button onClick={() => exportPackage(item,"copied")}>提案文をCopy</button><button onClick={() => downloadMarkdown(item)}>Markdown</button><button onClick={() => exportPackage(item,"downloaded")}>JSON</button></div>
            </div>;
          })}
          {previewPackage && <div className="package-preview" role="region" aria-label="Manual Execution Package preview">
            <div className="panel-heading"><div><span className="eyebrow">OWNER PREVIEW</span><h3>{previewPackage.payload_snapshot.campaignTitle}</h3></div><button className="text-button" onClick={() => setPreviewPackageId("")}>閉じる</button></div>
            <div className="package-preview-grid">
              <section><h4>1. サービス概要</h4><strong>{previewPackage.payload_snapshot.serviceName}</strong><p>{previewPackage.payload_snapshot.serviceSummary}</p></section>
              <section><h4>2. 対象顧客</h4><p>{previewPackage.payload_snapshot.targetCustomer}</p><p>{previewPackage.payload_snapshot.customerProblem}</p></section>
              <section><h4>3. 提供内容</h4><ul>{previewPackage.payload_snapshot.deliverables?.map((v)=><li key={v}>{v}</li>)}</ul><details><summary>対応範囲・対象外</summary><p>対応: {previewPackage.payload_snapshot.scopeIncluded?.join(" / ")}</p><p>対象外: {previewPackage.payload_snapshot.scopeExcluded?.join(" / ")}</p></details></section>
              <section><h4>4. 価格・原価予測</h4><p>予測価格 {money(previewPackage.payload_snapshot.forecastPriceMinor,previewPackage.payload_snapshot.currency)} / 予測原価 {money(previewPackage.payload_snapshot.forecastCostMinor,previewPackage.payload_snapshot.currency)} / 予測差額 {money(previewPackage.payload_snapshot.forecastNetMinor,previewPackage.payload_snapshot.currency)}</p></section>
              <section><h4>5. 納期・修正回数</h4><p>{previewPackage.payload_snapshot.deliveryDays}日 / {previewPackage.payload_snapshot.revisionLimit}回まで</p></section>
              <section><h4>6. 営業用短文</h4><p>{previewPackage.payload_snapshot.salesShortMessage}</p></section>
              <section className="wide"><h4>7. 提案用長文</h4><p>{previewPackage.payload_snapshot.salesLongProposal}</p></section>
              <section><h4>8. 手動実行手順</h4><ol>{previewPackage.payload_snapshot.executionChecklist?.map((v)=><li key={v}>{v}</li>)}</ol></section>
              <section><h4>9. Evidence登録手順</h4><ol>{previewPackage.payload_snapshot.evidenceInstructions?.map((v)=><li key={v}>{v}</li>)}</ol></section>
              <section className="wide disclosure"><h4>10. 注意事項</h4><p>{previewPackage.payload_snapshot.disclosure}</p></section>
            </div>
            <details className="technical-details"><summary>監査用Technical details</summary><p>Artifact version {previewPackage.artifact_version} · {destinationLabel[previewPackage.payload_snapshot.destinationType] || "Owner-selected manual channel"}</p></details>
          </div>}
        </article>

        <article className="production-panel">
          <div className="panel-heading"><div><span className="eyebrow">EVIDENCE INBOX</span><h2>実績Evidence候補を登録</h2></div><span className="mode-badge actual">ACTUALではありません</span></div>
          <label>Campaign
            <select id="evidence-campaign" disabled={Boolean(busy)} defaultValue="">
              <option value="" disabled>選択してください</option>
              {(snapshot?.campaigns || []).filter((item) => packages.some((value) => value.campaign_id === item.id)).map((item) => <option key={item.id} value={item.id}>{item.offer?.title || item.id.slice(0, 8)} · Evidence registration ready</option>)}
            </select>
          </label>
          <label>Evidence種別<select value={evidence.sourceType} onChange={(event)=>setEvidence({...evidence,sourceType:event.target.value})}><option value="invoice_paid">支払済み請求書</option><option value="bank_reference">銀行入金参照</option><option value="marketplace_order">Marketplace注文</option><option value="signed_contract">締結済み契約</option><option value="affiliate_commission">Affiliate成果</option><option value="platform_sales_export">販売Platform出力</option></select></label>
          <label>Evidence reference<input value={evidence.sourceReference} onChange={(event) => setEvidence({...evidence, sourceReference:event.target.value})} placeholder="Invoice / bank reference" /></label>
          <div className="evidence-fields">
            <label>Gross (minor)<input inputMode="numeric" value={evidence.amountMinor} onChange={(event) => setEvidence({...evidence, amountMinor:event.target.value})} /></label>
            <label>Cost (minor)<input inputMode="numeric" value={evidence.costAmountMinor} onChange={(event) => setEvidence({...evidence, costAmountMinor:event.target.value})} /></label>
          </div>
          <div className="evidence-fields"><label>通貨<input value={evidence.currency} maxLength="3" onChange={(event)=>setEvidence({...evidence,currency:event.target.value.toUpperCase()})}/></label><label>発生日<input type="date" value={evidence.occurredAt} onChange={(event)=>setEvidence({...evidence,occurredAt:event.target.value})}/></label></div>
          <label>Owner note（任意）<textarea value={evidence.note} onChange={(event)=>setEvidence({...evidence,note:event.target.value})} maxLength="500"/></label>
          <p className="evidence-boundary">機密区分: 財務情報 · 登録時点ではEvidence候補でありActual Revenueには含まれません。</p>
          <button className="production-secondary" disabled={Boolean(busy) || !evidence.sourceReference || !evidence.amountMinor} onClick={() => {
            const campaignId = document.getElementById("evidence-campaign")?.value;
            const checked=validateEvidenceRegistration({...evidence,campaignId,amountMinor:Number(evidence.amountMinor),costAmountMinor:Number(evidence.costAmountMinor),occurredAt:evidence.occurredAt?new Date(`${evidence.occurredAt}T00:00:00.000Z`).toISOString():""});
            if(!checked.valid){setError(checked.errors[0]);return;}
            run("evidence", () => repository.registerEvidence(context.workspace.id, campaignId, {
              ...checked.normalized,
            }), "Evidence候補を登録し、Actual Revenue承認待ちへ移動しました。");
          }}>{busy === "evidence" ? "登録中…" : "Evidence候補を登録"}</button>
          {(snapshot?.evidence || []).filter((item) => item.verification_status !== "verified").map((item) => {
            const campaign = snapshot?.campaigns?.find((value) => value.id === item.campaign_id);
            const approval = snapshot?.approvals?.find((value) => value.campaign_id === item.campaign_id && value.scope === "actual_revenue_verification" && value.status === "approved");
            return <div className="approval-row" key={item.id}>
              <div><strong>{money(item.amount_minor, item.currency)}</strong><small>Evidence確認待ち · Actual未計上</small></div>
              <button disabled={Boolean(busy) || !approval} title={approval ? "Owner承認済みEvidenceをActualへ確定" : "先にActual Revenue承認が必要"} onClick={() => run(`verify:${item.id}`,
                () => repository.verifyRevenue(item.id),
                "Evidenceを検証し、Actual Revenueを冪等に記録しました。")}>Actual確定</button>
            </div>;
          })}
        </article>

        <article className="production-panel">
          <div className="panel-heading"><div><span className="eyebrow">ACTUAL APPROVAL</span><h2>Evidence検証承認</h2></div><strong>{actualPending.length}</strong></div>
          {!actualPending.length&&<p className="empty-copy">Actual Revenueの承認待ちはありません。</p>}
          {actualPending.map((item)=><div className="approval-row" key={item.id}><div><strong>{money(item.preview_snapshot.amountMinor,item.preview_snapshot.currency)}</strong><small>Gross − Cost = {money(Number(item.preview_snapshot.amountMinor)-Number(item.preview_snapshot.costAmountMinor),item.preview_snapshot.currency)} · Snapshot固定</small></div><button disabled={Boolean(busy)} onClick={()=>run(`actual-approve:${item.id}`,()=>repository.decideApproval(item.id,"approve","Owner verified the immutable Actual Revenue evidence snapshot.",item.preview_snapshot),"Evidence Snapshotを承認しました。Actual確定を実行してください。")}>
            Evidenceを承認
          </button></div>)}
        </article>

        <article className="production-panel">
          <div className="panel-heading"><div><span className="eyebrow">DURABLE STATE</span><h2>Remote workflow</h2></div><button className="text-button" onClick={refresh}>再取得</button></div>
          {(snapshot?.workflows || []).slice(0, 5).map((item) => (
            <div className="workflow-row" key={item.id}><span>Revenue workflow</span><strong>{workflowLabel[item.current_step] || "準備中"}</strong><small>{item.current_step === "owner_artifact_approval" ? "Revenue Packageの承認が必要" : item.current_step === "manual_package_ready" ? "提案文をCopyまたはDownload" : item.current_step === "evidence_waiting" ? "実際の営業後にEvidenceを登録" : item.current_step === "actual_revenue_approval" ? "Owner承認とActual確定が必要" : "検証済みRevenue Record"}</small></div>
          ))}
          {!snapshot?.workflows?.length && <p className="empty-copy">Workflow runはまだありません。</p>}
        </article>
      </section>
    </main>
  );
}
