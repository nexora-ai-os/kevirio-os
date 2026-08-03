import { useCallback, useEffect, useMemo, useState } from "react";
import { createRevenueRepository } from "../repositories/revenueRepository.js";
import { ApprovalCard, Button, EmptyState, EnvironmentBadge, ErrorState, PageHeader, SectionHeader, SkeletonGroup, Stack } from "../design-system/index.js";
import "./ProductionScreens.css";

const variantForScope = (scope) => scope === "actual_revenue_verification" ? "actual_revenue_verification" : scope === "financial_commitment" ? "cost_threshold" : scope === "external_publish" || scope === "email_send" || scope === "social_post" ? "external_action" : "standard";

export default function CanonicalApprovals({ ownerSupabaseClient, ownerSession }) {
  // Production invariants: No bulk approval. Approval alone does not execute externally.
  const repository = useMemo(() => createRevenueRepository(ownerSupabaseClient), [ownerSupabaseClient]);
  const [context, setContext] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState("pending");
  const [reasons, setReasons] = useState({});
  const refresh = useCallback(async () => {
    try { const nextContext = await repository.loadContext(ownerSession); setContext(nextContext); setSnapshot(await repository.loadSnapshot(nextContext.workspace.id)); setError(""); }
    catch { setError("承認データを取得できませんでした。"); }
  }, [repository, ownerSession]);
  useEffect(() => { refresh(); }, [refresh]);
  const decide = async (approval, decision = "approve") => {
    if (busy) return;
    const reason = decision === "approve" ? "Owner verified the immutable preview snapshot." : reasons[approval.id]?.trim();
    if (!reason) return;
    setBusy(approval.id); setError(""); setNotice("");
    try { await repository.decideApproval(approval.id, decision, reason, approval.preview_snapshot); setNotice(`Decision recorded: ${decision}.`); await refresh(); }
    catch { setError("承認処理を安全に停止しました。有効期限、Version、Snapshot、Workspace境界を確認してください。"); }
    finally { setBusy(""); }
  };
  const approvals = snapshot?.approvals || [];
  const pending = approvals.filter((item) => item.status === "pending");
  const expiring = pending.filter((item) => item.expires_at && new Date(item.expires_at).getTime() - Date.now() <= 86400000 && new Date(item.expires_at).getTime() > Date.now());
  const completed = approvals.filter((item) => item.status !== "pending");
  const visiblePending = filter === "expiring" ? expiring : filter === "cost" ? pending.filter((item) => item.scope === "financial_commitment") : pending;
  const stateForApproval = (status) => ({ pending: "pending", approved: "approved", revision_requested: "candidate", rejected: "failed", expired: "expired", superseded: "cancelled" })[status] || "unknown";
  const renderApproval = (item) => <ApprovalCard key={item.id} variant={variantForScope(item.scope)} title={item.preview_snapshot?.title || item.scope.replaceAll("_", " ")} target={item.artifact_id || item.campaign_id} capability={item.scope} risk="技術情報は詳細で確認できます" costCeiling={item.risk_snapshot?.costCeiling} expiry={item.expires_at ? new Date(item.expires_at).toLocaleString("ja-JP") : "なし"} version={item.preview_snapshot?.artifactVersion} state={stateForApproval(item.status)} effect="承認だけでは外部実行されません" actions={item.status === "pending" ? <><label className="kv-decision-reason">判断理由<textarea value={reasons[item.id] || ""} onChange={(event) => setReasons((current) => ({ ...current, [item.id]: event.target.value }))} /></label><Button variant="approval" loading={busy === item.id} disabled={Boolean(busy)} disabledReason={busy && busy !== item.id ? "別の判断を処理中です" : undefined} onClick={() => decide(item, "approve")}>このSnapshotを承認</Button><Button variant="secondary" disabled={Boolean(busy) || !reasons[item.id]?.trim()} disabledReason={!reasons[item.id]?.trim() ? "判断理由が必要です" : undefined} onClick={() => decide(item, "revise")}>修正を依頼</Button><Button variant="danger" disabled={Boolean(busy) || !reasons[item.id]?.trim()} disabledReason={!reasons[item.id]?.trim() ? "判断理由が必要です" : undefined} onClick={() => decide(item, "reject")}>却下</Button></> : null}><details><summary>技術的な詳細</summary><pre className="kv-snapshot-preview">{JSON.stringify({ risk: item.risk_snapshot, snapshot: item.preview_snapshot }, null, 2)}</pre></details><p>この承認だけでは外部実行は有効になりません。</p></ApprovalCard>;
  return <main className="content kv-production-screen kv-archetype-review"><Stack gap="8"><PageHeader eyebrow="OWNER DECISION QUEUE" title="承認" description={context?.workspace?.name ? `${context.workspace.name} の判断待ち項目` : "Ownerによる安全な判断が必要な項目を確認します。"} actions={<EnvironmentBadge environment={context ? "production" : "locked"} />}/>{error ? <ErrorState title="承認一覧を表示できません" message={error} actionLabel="再試行" onAction={refresh} /> : null}{notice ? <p role="status" className="kv-screen-notice">{notice}</p> : null}{!snapshot && !error ? <SkeletonGroup count={4} label="承認一覧を読み込み中" /> : null}<div className="kv-approval-filters" aria-label="承認フィルター"><Button variant={filter === "pending" ? "primary" : "secondary"} aria-pressed={filter === "pending"} onClick={() => setFilter("pending")}>承認待ち {snapshot ? pending.length : "不明"}</Button><Button variant={filter === "expiring" ? "primary" : "secondary"} aria-pressed={filter === "expiring"} onClick={() => setFilter("expiring")}>期限間近 {snapshot ? expiring.length : "不明"}</Button><Button variant="secondary" disabled disabledReason="正式な高リスク分類フィールドは存在しません">高リスク：不明</Button><Button variant={filter === "cost" ? "primary" : "secondary"} aria-pressed={filter === "cost"} onClick={() => setFilter("cost")}>費用判断 {snapshot ? pending.filter((item) => item.scope === "financial_commitment").length : "不明"}</Button></div><section><SectionHeader title="判断が必要な項目" description="一括承認は行いません。各判断は固定されたSnapshotだけを対象にします。" />{visiblePending.length ? <div className="kv-card-list">{visiblePending.map(renderApproval)}</div> : <EmptyState title="条件に一致する承認はありません" message="選択中の条件に該当する正式なOwner判断はありません。" />}</section><section><SectionHeader title="完了した判断" description="承認、却下、修正依頼の履歴" />{completed.length ? <div className="kv-card-list">{completed.map(renderApproval)}</div> : <EmptyState title="完了した判断はありません" />}</section></Stack></main>;
}
