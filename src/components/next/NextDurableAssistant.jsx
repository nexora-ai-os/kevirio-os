import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { createPersistentAssistantRepository } from "../../repositories/assistantConversationRepository.js";
import { resolvePersonalWorkspace } from "../../repositories/personalWorkspaceRepository.js";
import { AI_AREA_CAPABILITIES } from "../../services/aiRealOperations.js";
import AssistantMarkdown from "./AssistantMarkdown.jsx";
import "./assistant-full-content.css";

const failureLabel = {
  GEMINI_QUOTA_EXHAUSTED: "無料AIの利用上限に達しました。Paid fallbackは使用していません。",
  PROVIDER_CREDENTIAL_REQUIRED: "Geminiを現在利用できません。",
  GEMINI_MODEL_UNAVAILABLE: "無料モデルを現在利用できません。",
  GEMINI_TIMEOUT: "Geminiの応答が時間内に完了しませんでした。",
  ASSISTANT_RESPONSE_PERSIST_FAILED: "回答を安全に保存できませんでした。",
  ASSISTANT_RESPONSE_LENGTH_MISMATCH: "回答の全文保存を確認できませんでした。",
  ASSISTANT_RESPONSE_EXCEEDS_M027_LIMIT: "回答が保存上限を超えたため、途中の内容を保存せず停止しました。",
};
const titleFrom = text => { const compact = text.replace(/\s+/g, " ").trim(); return compact.length > 42 ? `${compact.slice(0, 42)}…` : compact; };

export default function NextDurableAssistant({ client }) {
  const [params] = useSearchParams();
  const requestedFeature = params.get("feature");
  const feature = AI_AREA_CAPABILITIES[requestedFeature] ? requestedFeature : "assistant";
  const repository = useMemo(() => createPersistentAssistantRepository(client), [client]);
  const [threads, setThreads] = useState([]);
  const [threadId, setThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState(params.get("prompt") || "");
  const [workspaceId, setWorkspaceId] = useState(null);
  const [state, setState] = useState({ loading: true, sending: false, error: null });
  const endRef = useRef(null);

  const reloadThreads = useCallback(async preferredId => {
    const rows = await repository.listThreads();
    setThreads(rows);
    setThreadId(current => preferredId || (rows.some(row => row.id === current) ? current : rows[0]?.id || null));
  }, [repository]);
  const reloadMessages = useCallback(async id => {
    const rows = await repository.listMessages(id);
    setMessages(rows);
    return rows;
  }, [repository]);

  useEffect(() => {
    let active = true;
    Promise.all([resolvePersonalWorkspace(client), repository.listThreads()]).then(([workspace, rows]) => {
      if (!active) return;
      setWorkspaceId(workspace); setThreads(rows); setThreadId(rows[0]?.id || null); setState({ loading: false, sending: false, error: null });
    }).catch(() => active && setState({ loading: false, sending: false, error: "会話を読み込めませんでした。再読み込みしてください。" }));
    return () => { active = false; };
  }, [client, repository]);
  useEffect(() => {
    let active = true;
    if (!threadId) { setMessages([]); return undefined; }
    repository.listMessages(threadId).then(rows => active && setMessages(rows)).catch(() => active && setState(value => ({ ...value, error: "会話履歴を読み込めませんでした。" })));
    return () => { active = false; };
  }, [repository, threadId]);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" }); }, [messages, state.sending]);

  const createThread = async (seed = "新しい会話") => { const id = await repository.createThread(titleFrom(seed)); await reloadThreads(id); setMessages([]); return id; };
  const requestAssistant = async (activeThread, sourceMessageId, text) => {
    const { data } = await client.auth.getSession();
    const response = await fetch("/api/ai", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${data?.session?.access_token || ""}` }, body: JSON.stringify({ action: "assistantRespond", workspaceId, threadId: activeThread, sourceMessageId, feature, text }) });
    const result = await response.json();
    if (!response.ok || !result.ok) throw Object.assign(new Error(result.reasonCode || "GEMINI_UNAVAILABLE"), { reasonCode: result.reasonCode });
    await reloadMessages(activeThread); await reloadThreads(activeThread);
  };
  const submit = async () => {
    const text = input.trim(); if (!text || state.sending || !workspaceId) return;
    setState(value => ({ ...value, sending: true, error: null }));
    let activeThread = threadId;
    try {
      if (!activeThread) activeThread = await createThread(text);
      const saved = await repository.appendUserMessage(activeThread, text);
      setInput(""); await reloadMessages(activeThread); await requestAssistant(activeThread, saved.message_id, text);
    } catch (error) {
      setState(value => ({ ...value, error: `${failureLabel[error?.reasonCode] || "回答を生成できませんでした。"} あなたのメッセージは保存されています。` }));
    } finally { setState(value => ({ ...value, sending: false })); }
  };
  const retry = async () => {
    const lastUser = [...messages].reverse().find(item => item.role === "USER"); if (!lastUser || state.sending) return;
    setState(value => ({ ...value, sending: true, error: null }));
    try { await requestAssistant(threadId, lastUser.id, lastUser.content_text); }
    catch (error) { setState(value => ({ ...value, error: failureLabel[error?.reasonCode] || "再生成できませんでした。" })); }
    finally { setState(value => ({ ...value, sending: false })); }
  };
  const archive = async () => {
    const thread = threads.find(item => item.id === threadId);
    if (!thread || !window.confirm("この会話をアーカイブしますか？履歴は削除されません。")) return;
    try { await repository.archiveThread(thread.id, thread.version); await reloadThreads(); }
    catch { setState(value => ({ ...value, error: "会話をアーカイブできませんでした。" })); }
  };
  const latestAssistant = [...messages].reverse().find(item => item.role === "ASSISTANT");

  return <main className="next-workspace assistant-2">
    <header className="next-header"><div><span>KEVIRIO PRACTICAL INTELLIGENCE</span><h1>AI秘書</h1><p>会話を引き継ぎ、判断と次の一手を一緒に整理します。</p></div><div className="next-header__state"><span className="next-state next-state--ready">Gemini · LIVE AI</span><small>FREE · Paid AI ¥0 · External Execution LOCKED</small></div></header>
    <div className="assistant-2__layout">
      <aside className="next-card assistant-2__threads" aria-label="会話一覧"><button className="next-primary" onClick={() => createThread()} disabled={state.sending}>＋ 新しい会話</button>{threads.map(thread => <button key={thread.id} className="assistant-2__thread" aria-current={thread.id === threadId ? "page" : undefined} onClick={() => setThreadId(thread.id)}><strong>{thread.title}</strong><small>{thread.last_message_at ? new Date(thread.last_message_at).toLocaleString("ja-JP") : "新規"}</small></button>)}</aside>
      <section className="next-card assistant-2__chat" aria-busy={state.loading || state.sending}>
        <div className="assistant-2__toolbar"><span>{threads.find(item => item.id === threadId)?.title || "新しい会話"}</span>{threadId ? <button className="next-link" onClick={archive}>アーカイブ</button> : null}</div>
        <div className="assistant-2__messages" aria-live="polite">{messages.length ? messages.map(message => <article key={message.id} data-role={message.role} data-content-length={message.content_text.length} data-provider-raw-length={message.audit_metadata?.provider_raw_length ?? undefined} data-api-received-length={message.audit_metadata?.api_received_length ?? undefined} data-finish-reason={message.audit_metadata?.finish_reason ?? undefined}><b>{message.role === "USER" ? "あなた" : "AI秘書"}</b><AssistantMarkdown content={message.content_text}/>{message.role === "ASSISTANT" && message.audit_metadata?.model_output_limited ? <p className="assistant-2__limit" role="status">回答はモデルの出力上限で終了しました。画面表示による省略ではありません。</p> : null}{message.role === "ASSISTANT" ? <small>AI_OUTPUT · NOT_EVIDENCE · {message.provider || "AI"} · {new Date(message.created_at).toLocaleString("ja-JP")}</small> : <small>OWNER_INPUT</small>}</article>) : <div className="next-empty"><b>何から始めますか？</b><p>例：「今日やることを3つに絞って」</p></div>}{state.sending ? <p role="status">考えています…</p> : null}<div ref={endRef}/></div>
        {state.error ? <div className="assistant-2__error" role="alert">{state.error}<button className="next-link" onClick={retry}>もう一度試す</button></div> : null}
        <label className="assistant-2__composer"><span>メッセージ</span><textarea value={input} maxLength={4000} onChange={event => setInput(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) submit(); }} placeholder="続きの指示も自然な言葉で入力できます"/><button className="next-primary" disabled={state.loading || state.sending || !input.trim()} onClick={submit}>{state.sending ? "生成中…" : "送信"}</button></label>
        {latestAssistant ? <div className="next-actions"><button className="next-link" onClick={() => navigator.clipboard?.writeText(latestAssistant.content_text)}>全文をコピー</button><button className="next-link" onClick={retry}>再生成</button></div> : null}
      </section>
    </div>
    <section className="next-card next-card--wide"><h2>System Health</h2><dl className="next-ai-meta"><div><dt>Provider</dt><dd>Gemini</dd></div><div><dt>Cost</dt><dd>FREE · ¥0 HARD LOCK</dd></div><div><dt>Timestamp</dt><dd>{latestAssistant?.created_at || "未生成"}</dd></div><div><dt>Data basis</dt><dd>Bounded Personal Workspace context</dd></div><div><dt>Conversation persistence</dt><dd>M027 · Personal Workspace</dd></div><div><dt>Truth</dt><dd>AI output ≠ Evidence · Forecast ≠ Actual</dd></div><div><dt>External Execution</dt><dd>LOCKED</dd></div></dl></section>
  </main>;
}
