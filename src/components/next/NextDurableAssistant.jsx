import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { buildTodayActions, loadAuthorizedPersonalContext } from "../../repositories/personalContextRepository.js";
import { AI_AREA_CAPABILITIES, AI_ROUTER_POLICY } from "../../services/aiRealOperations.js";

function localAnswer(text, context) {
  const action = buildTodayActions(context || {})[0];
  if (/収益|売上/.test(text)) return context?.revenueState === "KNOWN" ? { message: `確認可能なActual Revenue記録は${context.revenue.length}件です。未計上や欠損を推測しません。`, path: "/revenue" } : { message: "Actual RevenueはUNKNOWNです。UNKNOWNを0円として扱いません。", path: "/revenue" };
  if (/Affiliate|アフィリエイト/i.test(text)) return { message: "Program比較、優先順位、content angle、compliance riskを整理できます。自動scrapingやconversion実績の捏造は行いません。", path: "/affiliate" };
  return action ? { message: `今日の優先候補は「${action.title}」です。理由: ${action.reason}`, path: action.path } : { message: "許可された記録から確定できる優先作業はありません。新しい作業を登録してから再確認してください。", path: "/home" };
}

export default function NextDurableAssistant({ client }) {
  const navigate = useNavigate(), [params] = useSearchParams(), requestedFeature = params.get("feature");
  const feature = AI_AREA_CAPABILITIES[requestedFeature] ? requestedFeature : "assistant";
  const [context, setContext] = useState(null), [input, setInput] = useState(""), [answer, setAnswer] = useState(null), [loading, setLoading] = useState(true);
  useEffect(() => { let active = true; loadAuthorizedPersonalContext(client).then((value) => { if (active) { setContext(value); setLoading(false); } }).catch(() => { if (active) { setContext(null); setLoading(false); } }); return () => { active = false; }; }, [client]);
  const submit = () => { const text = input.trim(); if (!text) return; setAnswer({ ...localAnswer(text, context), provider: "local-deterministic", providerState: "FREE_TIER_UNVERIFIED", cost: "FREE / ¥0", timestamp: new Date().toISOString(), basis: "Owner Personal Workspaceで現在許可された最小限の記録", feature }); };
  return <main className="next-workspace">
    <header className="next-header"><div><span>KEVIRIO NEXT</span><h1>AI秘書</h1><p>{AI_AREA_CAPABILITIES[feature]}</p></div><div className="next-header__state"><span className="next-state next-state--manual">FREE_ONLY</span><small>Paid AI ¥0 · External Execution LOCKED</small></div></header>
    <section className="next-card next-card--wide"><label className="next-chat">日本語で相談<textarea value={input} maxLength={4000} onChange={(event) => setInput(event.target.value)} placeholder="例: 今日の優先順位を整理して" /></label><button className="next-primary" disabled={loading || !input.trim()} onClick={submit}>{loading ? "許可された情報を確認中…" : "AIに相談"}</button>{answer ? <div className="next-answer" role="status"><p>{answer.message}</p><dl className="next-ai-meta"><div><dt>Provider</dt><dd>{answer.provider} · {answer.providerState}</dd></div><div><dt>Cost</dt><dd>{answer.cost}</dd></div><div><dt>Data basis</dt><dd>{answer.basis}</dd></div><div><dt>Timestamp</dt><dd>{answer.timestamp}</dd></div></dl><div className="next-actions"><button className="next-link" onClick={() => navigator.clipboard?.writeText(answer.message)}>コピー</button><button className="next-link" onClick={() => setAnswer(null)}>再生成準備</button><button className="next-link" onClick={() => navigate(answer.path)}>関連画面を開く</button></div></div> : null}</section>
    <section className="next-card next-card--wide"><h2>Router policy</h2><p>Gemini: FREE_TIER_UNVERIFIED · Fallback: {AI_ROUTER_POLICY.fallback} · Paid fallback: OFF · Privacy: PERSONAL_PRIVATE</p><p className="next-note">GeminiのAPI/model疎通は確認済みですが、free eligibilityが外部証拠で確定するまで日常生成には使いません。AI回答はEvidenceまたはOwner Approvalではありません。</p></section>
  </main>;
}
