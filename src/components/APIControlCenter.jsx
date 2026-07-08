import { useEffect, useMemo, useState } from "react";
import { aiOrchestratorModes, runAIOrchestrator } from "../services/aiOrchestrator";
import { apiGroups, apiMilestones, buildClientApiReadiness } from "../services/apiRegistry";
import { aiDepartments, buildAgentActionMap, buildAgentCompanySummary } from "../services/agentCompany";

const defaultStatus = { ok: false, automationReady: false, readyCount: 0, totalProviders: 0, providers: [], groups: [], principles: [], nextBestAction: "接続準備を順に進めます。" };

function normalizeProvider(provider = {}, fallback = {}) {
  const configured = typeof provider.configured === "boolean"
    ? provider.configured
    : Boolean(provider.status === "connected" || provider.status === "connected-base" || provider.status === "ready");

  return {
    ...fallback,
    ...provider,
    id: provider.id || fallback.id || "provider",
    name: provider.name || fallback.name || "Provider",
    role: provider.role || fallback.role || "準備中",
    configured,
    model: provider.model || provider.status || fallback.model || "planned",
    envKeys: Array.isArray(provider.envKeys) ? provider.envKeys : Array.isArray(fallback.envKeys) ? fallback.envKeys : [],
    secretVisible: false,
  };
}

function normalizeStatus(rawStatus = {}) {
  const status = rawStatus && typeof rawStatus === "object" ? rawStatus : {};
  const fallbackGroups = apiGroups.map((group) => ({
    ...group,
    providers: group.providers.map((provider) => normalizeProvider({ ...provider, configured: false, model: provider.status, secretVisible: false }, provider)),
  }));

  const groups = Array.isArray(status.groups) && status.groups.length
    ? status.groups.map((group) => ({
        ...group,
        providers: Array.isArray(group.providers)
          ? group.providers.map((provider) => normalizeProvider(provider, provider))
          : [],
      }))
    : fallbackGroups;

  const providers = Array.isArray(status.providers) && status.providers.length
    ? status.providers.map((provider) => normalizeProvider(provider, provider))
    : groups.flatMap((group) => group.providers.map((provider) => normalizeProvider(provider, provider)));

  const readyCount = typeof status.readyCount === "number"
    ? status.readyCount
    : providers.filter((provider) => provider.configured).length;
  const totalProviders = typeof status.totalProviders === "number" ? status.totalProviders : providers.length;
  const automationReady = typeof status.automationReady === "boolean"
    ? status.automationReady
    : providers.some((provider) => provider.id === "openai" && provider.configured) && providers.some((provider) => provider.id === "gemini" && provider.configured);

  return {
    ...defaultStatus,
    ...status,
    automationReady,
    readyCount,
    totalProviders,
    providers,
    groups,
    principles: Array.isArray(status.principles) && status.principles.length ? status.principles : defaultStatus.principles,
    nextBestAction: status.nextBestAction || defaultStatus.nextBestAction,
  };
}

export default function APIControlCenter({ setPage }) {
  const [status, setStatus] = useState(defaultStatus);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orchestratorResult, setOrchestratorResult] = useState(null);
  const [orchestratorLoading, setOrchestratorLoading] = useState(false);
  const agentSummary = buildAgentCompanySummary();
  const actionMap = buildAgentActionMap();
  const normalizedStatus = useMemo(() => normalizeStatus(status), [status]);
  const readiness = useMemo(() => buildClientApiReadiness(normalizedStatus.providers || []), [normalizedStatus.providers]);

  const loadStatus = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/status");
      const rawText = await res.text();
      let data = {};

      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = {};
      }

      if (!res.ok) throw new Error(data.error || "API status check failed");
      setStatus(normalizeStatus(data));
    }
    catch (err) {
      setError(err.message || "API status check failed");
      setStatus(defaultStatus);
    }
    finally { setLoading(false); }
  };
  useEffect(() => { loadStatus(); }, []);

  const testOrchestrator = async (mode = "general") => {
    setOrchestratorLoading(true); setOrchestratorResult(null);
    try { const result = await runAIOrchestrator({ mode, provider: "auto", message: "KEVIRIO v5.1のAI Orchestrator接続テストです。事実・推測・意見・要確認を分け、最終決裁はオーナーであることを明記してください。" }); setOrchestratorResult(result); }
    catch (err) { setOrchestratorResult({ ok: false, error: err.message }); }
    finally { setOrchestratorLoading(false); }
  };

  const groups = normalizedStatus.groups?.length
    ? normalizedStatus.groups.map((group) => ({
        ...group,
        providers: Array.isArray(group.providers) ? group.providers.map((provider) => normalizeProvider(provider, provider)) : [],
      }))
    : apiGroups.map((group) => ({
        ...group,
        providers: group.providers.map((provider) => normalizeProvider({ ...provider, configured: false, model: provider.status, secretVisible: false }, provider)),
      }));

  return (
    <main className="content">
      <section className="hero">
        <p className="eyebrow">API / AI CONTROL CENTER v5.1</p>
        <h1>APIは増やす。操作は増やさない。</h1>
        <p className="lead">Claude、Perplexity、Google、Canva、SNS、ASPまで見据えた接続基盤です。APIキーの値は表示しません。</p>
        <div className="actions"><button onClick={loadStatus}>{loading ? "確認中..." : "再確認"}</button><button onClick={() => setPage("home")}>Homeへ</button><button onClick={() => setPage("campaign")}>Campaignへ</button></div>
      </section>
      <div className="stats">
        <div className="stat-card"><span>API Ready</span><strong>{normalizedStatus.readyCount}件</strong><p>{normalizedStatus.totalProviders}件中</p></div>
        <div className="stat-card"><span>Readiness</span><strong>{readiness.score}%</strong><p>接続準備率</p></div>
        <div className="stat-card"><span>AI Staff</span><strong>{agentSummary.uniqueAgents}人</strong><p>{agentSummary.departments}部門</p></div>
        <div className="stat-card"><span>Automation</span><strong>{normalizedStatus.automationReady ? "Ready" : "Setup"}</strong><p>Owner Final</p></div>
      </div>
      {error && <section className="panel danger-panel"><p className="eyebrow">ERROR</p><h2>API状態を取得できませんでした</h2><p>{error}</p></section>}
      <section className="panel"><div className="section-head"><div><p className="eyebrow">NEXT BEST ACTION</p><h2>次に接続すべきAPI</h2></div><span className="badge">Phase Based</span></div><div className="mission-list"><div>{normalizedStatus.nextBestAction || readiness.nextBestAction}</div><div>原則：APIは増やすが、ユーザーの操作は増やさない。</div><div>最優先：Claude / Perplexity / Google OAuth / Canva / SNS API準備。</div></div></section>
      <section className="panel"><div className="section-head"><div><p className="eyebrow">PROVIDER GROUPS</p><h2>API接続マップ</h2></div><span className="badge">Secrets Hidden</span></div>{groups.map((group) => <div className="api-group" key={group.id}><div className="section-head compact"><div><p className="eyebrow">{group.id}</p><h2>{group.name}</h2></div></div><div className="grid">{group.providers.map((provider) => <div className="card" key={provider.id}><div className="card-header"><span className="badge">{provider.configured ? "Ready" : "Not Set"}</span><span className="badge">{provider.model || provider.status || "planned"}</span></div><h2>{provider.name}</h2><p>{provider.role}</p><ul><li>Status：{provider.configured ? "設定済み" : "未設定"}</li><li>Secret：非表示</li><li>Keys：{provider.envKeys?.join(" / ") || "要確認"}</li></ul></div>)}</div></div>)}</section>
      <section className="panel"><div className="section-head"><div><p className="eyebrow">AI ORCHESTRATOR</p><h2>用途別AIルーティング</h2></div><span className="badge">{orchestratorLoading ? "Testing" : "Ready"}</span></div><div className="grid">{aiOrchestratorModes.map((mode) => <div className="card" key={mode.id}><span className="badge">{mode.provider}</span><h2>{mode.name}</h2><p>{mode.role}</p><div className="actions"><button onClick={() => testOrchestrator(mode.id)} disabled={orchestratorLoading}>{orchestratorLoading ? "確認中..." : "接続テスト"}</button></div></div>)}</div>{orchestratorResult && <div className="ai-report orchestrator-result"><strong>Orchestrator Result：{orchestratorResult.ok ? `${orchestratorResult.provider} / ${orchestratorResult.model}` : "Error"}</strong><p>{orchestratorResult.ok ? orchestratorResult.text : orchestratorResult.error || "AI Orchestrator failed"}</p>{orchestratorResult.fallbackUsed && <small>Fallback used: yes</small>}</div>}</section>
      <section className="panel"><div className="section-head"><div><p className="eyebrow">AI COMPANY</p><h2>AI社員・部署構成</h2></div><span className="badge">{agentSummary.uniqueAgents} Agents</span></div><div className="grid">{aiDepartments.map((department) => <div className="card" key={department.id}><span className="badge">{department.name}</span><h2>{department.mission}</h2><p>{department.agents.join(" / ")}</p></div>)}</div></section>
      <section className="panel"><div className="section-head"><div><p className="eyebrow">ACTION MAP</p><h2>見える画面は少なく、裏側は強く</h2></div></div><div className="mission-list">{actionMap.map((item) => <div key={item.action}>{item.action}｜{item.visiblePage}｜{item.agents.join(" / ")}</div>)}</div></section>
      <section className="panel"><div className="section-head"><div><p className="eyebrow">ROADMAP</p><h2>API拡張フェーズ</h2></div></div><div className="mission-list">{apiMilestones.map((item) => <div key={item.phase}>{item.phase}｜{item.title}｜{item.goal}</div>)}</div></section>
      <section className="panel"><div className="section-head"><div><p className="eyebrow">GOVERNANCE</p><h2>AI実行ルール</h2></div><span className="badge">Owner Final</span></div><div className="mission-list">{(normalizedStatus.principles || []).map((principle) => <div key={principle}>✅ {principle}</div>)}<div>✅ SNS投稿・DM・コメント返信・広告出稿は承認後のみ。</div><div>✅ APIは接続しても、危険な外部実行は自動化しない。</div></div></section>
    </main>
  );
}
