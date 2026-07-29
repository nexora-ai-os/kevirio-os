import { useCallback, useEffect, useMemo, useState } from "react";
import { createRevenueRepository } from "../repositories/revenueRepository.js";
import { ApprovalCard, Button, EmptyState, EnvironmentBadge, ErrorState, PageHeader, SectionHeader, SkeletonGroup, Stack } from "../design-system/index.js";
import "./ProductionScreens.css";

const variantForScope = (scope) => scope === "actual_revenue_verification" ? "actual_revenue_verification" : scope === "financial_commitment" ? "cost_threshold" : scope === "external_publish" || scope === "email_send" || scope === "social_post" ? "external_action" : "standard";

export default function CanonicalApprovals({ ownerSupabaseClient, ownerSession }) {
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
    catch { setError("Approval repository could not be retrieved."); }
  }, [repository, ownerSession]);
  useEffect(() => { refresh(); }, [refresh]);
  const decide = async (approval, decision = "approve") => {
    if (busy) return;
    const reason = decision === "approve" ? "Owner verified the immutable preview snapshot." : reasons[approval.id]?.trim();
    if (!reason) return;
    setBusy(approval.id); setError(""); setNotice("");
    try { await repository.decideApproval(approval.id, decision, reason, approval.preview_snapshot); setNotice(`Decision recorded: ${decision}.`); await refresh(); }
    catch { setError("Approval was safely stopped. Verify expiry, version, snapshot, and Workspace boundary."); }
    finally { setBusy(""); }
  };
  const approvals = snapshot?.approvals || [];
  const pending = approvals.filter((item) => item.status === "pending");
  const expiring = pending.filter((item) => item.expires_at && new Date(item.expires_at).getTime() - Date.now() <= 86400000 && new Date(item.expires_at).getTime() > Date.now());
  const completed = approvals.filter((item) => item.status !== "pending");
  const visiblePending = filter === "expiring" ? expiring : filter === "cost" ? pending.filter((item) => item.scope === "financial_commitment") : pending;
  const stateForApproval = (status) => ({ pending: "pending", approved: "approved", revision_requested: "candidate", rejected: "failed", expired: "expired", superseded: "cancelled" })[status] || "unknown";
  const renderApproval = (item) => <ApprovalCard key={item.id} variant={variantForScope(item.scope)} title={item.preview_snapshot?.title || item.scope.replaceAll("_", " ")} target={item.artifact_id || item.campaign_id} capability={item.scope} risk={<code>{JSON.stringify(item.risk_snapshot || {})}</code>} costCeiling={item.risk_snapshot?.costCeiling} expiry={item.expires_at ? new Date(item.expires_at).toLocaleString() : "None"} version={item.preview_snapshot?.artifactVersion} state={stateForApproval(item.status)} effect="Approval alone does not execute externally" actions={item.status === "pending" ? <><label className="kv-decision-reason">Decision reason<textarea value={reasons[item.id] || ""} onChange={(event) => setReasons((current) => ({ ...current, [item.id]: event.target.value }))} /></label><Button variant="approval" loading={busy === item.id} disabled={Boolean(busy)} disabledReason={busy && busy !== item.id ? "Another decision is in progress" : undefined} onClick={() => decide(item, "approve")}>Approve exact snapshot</Button><Button variant="secondary" disabled={Boolean(busy) || !reasons[item.id]?.trim()} disabledReason={!reasons[item.id]?.trim() ? "A decision reason is required" : undefined} onClick={() => decide(item, "revise")}>Request revision</Button><Button variant="danger" disabled={Boolean(busy) || !reasons[item.id]?.trim()} disabledReason={!reasons[item.id]?.trim() ? "A decision reason is required" : undefined} onClick={() => decide(item, "reject")}>Reject</Button></> : null}><details><summary>Exact snapshot</summary><pre className="kv-snapshot-preview">{JSON.stringify(item.preview_snapshot, null, 2)}</pre></details><p>This approval alone does not enable external execution.</p></ApprovalCard>;
  return <main className="content kv-production-screen"><Stack gap="8"><PageHeader title="Approvals" description={context?.workspace?.name || "Owner decision queue"} actions={<EnvironmentBadge environment={context ? "production" : "locked"} />}/>{error ? <ErrorState title="Approvals unavailable" message={error} actionLabel="Retry" onAction={refresh} /> : null}{notice ? <p role="status" className="kv-screen-notice">{notice}</p> : null}{!snapshot && !error ? <SkeletonGroup count={4} label="Loading approvals" /> : null}<div className="kv-approval-filters" aria-label="Approval filters"><Button variant={filter === "pending" ? "primary" : "secondary"} aria-pressed={filter === "pending"} onClick={() => setFilter("pending")}>Pending {snapshot ? pending.length : "Unknown"}</Button><Button variant={filter === "expiring" ? "primary" : "secondary"} aria-pressed={filter === "expiring"} onClick={() => setFilter("expiring")}>Expiring {snapshot ? expiring.length : "Unknown"}</Button><Button variant="secondary" disabled disabledReason="No canonical high-risk classification field">High risk: Unknown</Button><Button variant={filter === "cost" ? "primary" : "secondary"} aria-pressed={filter === "cost"} onClick={() => setFilter("cost")}>Cost threshold {snapshot ? pending.filter((item) => item.scope === "financial_commitment").length : "Unknown"}</Button></div><section><SectionHeader title="Action required" description="No bulk approval. Every decision uses its exact immutable snapshot." />{visiblePending.length ? <div className="kv-card-list">{visiblePending.map(renderApproval)}</div> : <EmptyState title="No matching approvals" message="No canonical Owner decision matches this filter." />}</section><section><SectionHeader title="Completed decisions" />{completed.length ? <div className="kv-card-list">{completed.map(renderApproval)}</div> : <EmptyState title="No completed decisions" />}</section></Stack></main>;
}
