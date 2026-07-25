import { useEffect, useMemo, useRef, useState } from "react";
import { bootstrapOwnerWorkspace, inspectOwnerWorkspace } from "../services/workspaceBootstrapService";

const LABELS = {
  checking: "REMOTE CHECKING",
  not_initialized: "REMOTE BOOTSTRAP REQUIRED",
  ready: "VERIFIED",
  loading: "INITIALIZING",
  success: "INITIALIZED",
  already_exists: "ALREADY EXISTS",
  failure: "CHECK FAILED",
};

export default function ProductionFoundationPanel({ ownerSession, ownerSupabaseClient }) {
  const [remote, setRemote] = useState({ status: "checking", migrationStatus: "checking", workspace: null, brand: null });
  const inFlight = useRef(false);
  useEffect(() => {
    let active = true;
    setRemote({ status: "checking", migrationStatus: "checking", workspace: null, brand: null });
    inspectOwnerWorkspace(ownerSupabaseClient).then((result) => {
      if (!active) return;
      setRemote(result.ok ? result : { ...result, migrationStatus: "not_verified", workspace: null, brand: null });
    });
    return () => { active = false; };
  }, [ownerSession?.user?.id, ownerSupabaseClient]);

  const initialize = async () => {
    if (inFlight.current || remote.status === "ready" || remote.status === "already_exists") return;
    inFlight.current = true;
    setRemote((current) => ({ ...current, status: "loading" }));
    const result = await bootstrapOwnerWorkspace(ownerSupabaseClient);
    setRemote(result.ok ? result : { ...result, migrationStatus: remote.migrationStatus, workspace: null, brand: null });
    inFlight.current = false;
  };

  const display = useMemo(() => {
    const workspaceName = remote.workspace?.name || "KEVIRIO Owner Workspace";
    const brandName = remote.brand?.name || "KEVIRIO";
    const workspaceStatus = LABELS[remote.status] || LABELS.failure;
    const migrationStatus = remote.migrationStatus === "verified" ? "VERIFIED" : remote.migrationStatus === "checking" ? "REMOTE CHECKING" : "REMOTE NOT VERIFIED";
    return { workspaceName, brandName, workspaceStatus, migrationStatus };
  }, [remote]);

  const items=[
    ["Current Workspace / Brand",`${display.workspaceName} / ${display.brandName}`,display.workspaceStatus],
    ["Revenue Source of Truth","Supabase Migration 003",display.migrationStatus],
    ["Actual Revenue","Evidence verification only","ACTUAL ONLY"],
    ["External Execution","Direct Service manual export candidate","LOCKED"],
    ["Security","App-wide Owner Auth / Workspace RLS","CONDITIONAL"],
    ["API Cost","Controlled OpenAI Sandbox","SERVER CAPPED"],
  ];
  const canInitialize = ownerSession?.user?.id && ["not_initialized","failure"].includes(remote.status);
  return <section className="panel production-foundation-panel" aria-labelledby="production-foundation-title">
    <div className="section-head"><div><p className="eyebrow">Revenue Production Foundation</p><h2 id="production-foundation-title">Owner Control Status</h2></div><span className="status-badge">{ownerSession?.user?.id ? "OWNER VERIFIED" : "LOCKED"}</span></div>
    <div className="metric-grid">{items.map(([label,value,status])=><article className="metric-card" key={label}><span>{label}</span><strong>{value}</strong><small>{status}</small></article>)}</div>
    {canInitialize && <button type="button" onClick={initialize} disabled={inFlight.current || remote.status === "loading"}>Owner Workspaceを初期化</button>}
    {remote.status === "loading" && <p role="status">Owner Workspaceを安全に初期化しています。</p>}
    {remote.status === "success" && <p role="status">Workspace・Owner membership・KEVIRIO Brandを確認しました。</p>}
    {remote.status === "already_exists" && <p role="status">Owner Workspaceはすでに初期化済みです。</p>}
    {remote.status === "failure" && <p role="alert">初期化状態を確認できませんでした。Migration 004とRLSを確認してください。</p>}
    <p>Mock・Forecast・Actualは別Domainです。外部送信、投稿、課金、Deploymentは有効化されていません。</p>
  </section>;
}
