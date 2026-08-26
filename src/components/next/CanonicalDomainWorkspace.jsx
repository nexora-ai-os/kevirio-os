import { useCallback, useEffect, useMemo, useState } from "react";
import {
  archiveCanonicalDomain, CANONICAL_DOMAIN_CONFIG, listCanonicalDomain, listCanonicalTimeline,
  loadCanonicalDependencies, loadCanonicalDrafts, saveCanonicalDomain, saveCanonicalDraft,
} from "../../repositories/canonicalDomainRepository.js";
import { friendlyError } from "./nextUx.js";
import { OWNER_SAVE_STATE, SaveState, useOwnerEditGuard } from "../../app/ownerEditGuard.jsx";

const LABELS = { GOAL: "目標・戦略", APPLICATION: "応募・営業", WORK: "プロジェクト", CLIENT: "顧客・CRM", CONTENT: "制作・コンテンツ", KNOWLEDGE: "Knowledge", IMPROVEMENT: "改善BOX" };
const deviceHint = () => `${navigator.userAgentData?.mobile ? "mobile" : "browser"}:${window.innerWidth}`;

function payloadFor(type, form) {
  const title = String(form.get("title") || "").trim();
  const summary = String(form.get("summary") || "").trim();
  if (type === "CLIENT") return { display_name: title, status: "active", confidentiality_level: "customer_confidential", metadata: {}, business_context: { summary } };
  if (type === "KNOWLEDGE") return { record_type: "fact", sensitivity_level: "internal", provenance: { source: "OWNER_STATED", evidence_status: "OWNER_INPUT" }, content_json: { title, summary }, retention_policy: "owner_managed" };
  if (type === "APPLICATION") return { title, summary, brand_id: String(form.get("brand_id")), client_id: String(form.get("client_id") || "") || null, lane: "service", status: "discovered", provenance: { source: "OWNER_STATED" } };
  if (type === "GOAL") return { opportunity_id: String(form.get("opportunity_id")), brand_id: String(form.get("brand_id")), client_id: null, business_mode: "own_business", lane: "service", status: "draft", offer: { title, summary }, channel: "internal", forecast_currency: null, forecast_revenue_minor: null, forecast_cost_minor: null };
  if (type === "WORK") return { campaign_id: String(form.get("campaign_id")), type: title, status: "pending", assignee_type: "owner", due_at: String(form.get("due_at") || "") || null, input_ref: { summary }, output_ref: {} };
  return { title, lifecycle_status: "DRAFT", payload: { body: summary, status: "DRAFT", source: "OWNER_STATED", external_execution: "LOCKED", paid_ai_jpy: 0 } };
}

export default function CanonicalDomainWorkspace({ client, type }) {
  const [state, setState] = useState({ loading: true, rows: [], drafts: [], timeline: [], dependencies: { brands: [], applications: [], goals: [], clients: [] } });
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState(null);
  const [draftText, setDraftText] = useState("");
  const [saveState, setSaveState] = useState(OWNER_SAVE_STATE.SAVED);
  const [saveDetail, setSaveDetail] = useState("");
  useOwnerEditGuard(`canonical-${type}`, saveState, saveDetail);
  const reload = useCallback(async () => {
    setState((old) => ({ ...old, loading: true, error: null }));
    try {
      const [rows, drafts, timeline, dependencies] = await Promise.all([listCanonicalDomain(client, type), loadCanonicalDrafts(client, type), listCanonicalTimeline(client, type), loadCanonicalDependencies(client)]);
      setState({ loading: false, rows, drafts, timeline, dependencies, error: null });
    } catch (error) { setState((old) => ({ ...old, loading: false, error })); }
  }, [client, type]);
  useEffect(() => { reload(); }, [reload]);
  const visible = useMemo(() => state.rows.filter((row) => JSON.stringify(row).toLocaleLowerCase("ja").includes(query.toLocaleLowerCase("ja"))), [state.rows, query]);
  const submit = async (event) => {
    event.preventDefault(); setMessage(""); setSaveState(OWNER_SAVE_STATE.SAVING); setSaveDetail("");
    try { await saveCanonicalDomain(client, { type, payload: payloadFor(type, new FormData(event.currentTarget)) }); event.currentTarget.reset(); setMessage("Personal Workspaceへ保存しました。"); setSaveState(OWNER_SAVE_STATE.SAVED); await reload(); }
    catch (error) { const detail=friendlyError(error, "保存できませんでした。入力内容は保持されています。再試行してください。"); setMessage(detail); setSaveDetail(detail); setSaveState(String(error?.message||"").toLowerCase().includes("stale")?OWNER_SAVE_STATE.CONFLICT:OWNER_SAVE_STATE.SAVE_FAILED); }
  };
  const saveDraft = async () => {
    if (!editing || !draftText.trim()) return;
    const current = state.drafts.find((draft) => draft.object_id === editing.id);
    setSaveState(OWNER_SAVE_STATE.SAVING); setSaveDetail("");
    try {
      await saveCanonicalDraft(client, { type, id: editing.id, expectedDraftVersion: current?.draft_version || 1, baseObjectVersion: editing.version, payload: { body: draftText }, deviceHint: deviceHint() });
      setMessage("下書きを端末間で再開できる状態に保存しました。"); setSaveState(OWNER_SAVE_STATE.SAVED); await reload();
    } catch (error) { const detail=friendlyError(error, "別端末で更新されています。入力内容は保持されています。再読み込み後、内容を確認してください。"); setMessage(detail); setSaveDetail(detail); setSaveState(String(error?.message||"").toLowerCase().includes("stale")?OWNER_SAVE_STATE.CONFLICT:OWNER_SAVE_STATE.SAVE_FAILED); }
  };
  const archive = async (row) => {
    if (!window.confirm(`「${row.canonical_title}」をアーカイブしますか？`)) return;
    try { await archiveCanonicalDomain(client, { type, id: row.id, expectedVersion: row.version, row }); setMessage("アーカイブしました。"); await reload(); }
    catch (error) { setMessage(friendlyError(error, "別端末で更新されています。再読み込みして確認してください。")); }
  };
  const needsBrand = type === "APPLICATION"; const needsApplication = type === "GOAL"; const needsGoal = type === "WORK";
  const blocked = (needsBrand && !state.dependencies.brands.length) || (needsApplication && !state.dependencies.applications.length) || (needsGoal && !state.dependencies.goals.length);
  return <main className="next-workspace" aria-busy={state.loading}>
    <header className="next-header"><div><span>KEVIRIO NEXT</span><h1>{LABELS[type]}</h1><p>Personal Workspaceの正規データを、M029の保護された経路で管理します。</p></div><div className="next-header__state"><span className="next-state next-state--blocked">外部実行 停止中</span><small>Paid AI ¥0</small></div></header>
    <div className="next-grid">
    <section className="next-card next-card--wide"><header><h2>{LABELS[type]}を登録</h2></header>
      <form className="next-form" onSubmit={submit} onChange={()=>setSaveState(OWNER_SAVE_STATE.UNSAVED)}>
        <label className="next-span">タイトル<input name="title" required maxLength={300}/></label>
        <label className="next-span">内容<textarea name="summary" maxLength={4000}/></label>
        {needsBrand ? <label>Brand<select name="brand_id" required>{state.dependencies.brands.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label> : null}
        {needsBrand ? <label>顧客（任意）<select name="client_id"><option value="">なし</option>{state.dependencies.clients.map((x) => <option key={x.id} value={x.id}>{x.display_name}</option>)}</select></label> : null}
        {needsApplication ? <><label>起点の応募・機会<select name="opportunity_id" required>{state.dependencies.applications.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}</select></label><label>Brand<select name="brand_id" required>{state.dependencies.brands.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label></> : null}
        {needsGoal ? <label>関連目標<select name="campaign_id" required>{state.dependencies.goals.map((x) => <option key={x.id} value={x.id}>{x.offer?.title || x.channel}</option>)}</select></label> : null}
        {needsGoal ? <label>期限<input name="due_at" type="datetime-local"/></label> : null}
        <button className="next-primary" disabled={blocked || state.loading || saveState===OWNER_SAVE_STATE.SAVING}>{saveState===OWNER_SAVE_STATE.SAVING?"保存中…":"保存"}</button>
      </form>{blocked ? <p className="next-warning">先に必要な参照データを登録してください。データ整合性のため参照なしでは保存しません。</p> : null}{message ? <p role="status">{message}</p> : null}
      <SaveState state={saveState} detail={saveDetail}/>
    </section>
    <section className="next-card next-card--wide"><header><h2>保存済みデータ</h2></header><label>検索<input type="search" value={query} onChange={(e) => setQuery(e.target.value)}/></label>
      {state.error ? <p role="alert">読み込みに失敗しました。<button className="next-link" onClick={reload}>再試行</button></p> : visible.length ? <ul className="next-list">{visible.map((row) => <li key={row.id}><b>{row.canonical_title}</b><span>{row.status || row.lifecycle_status || row.deletion_status} / v{row.version}</span><button className="next-link" onClick={() => { setEditing(row); setDraftText(state.drafts.find((d) => d.object_id === row.id)?.payload?.body || ""); }}>下書き・編集</button><button className="next-link" onClick={() => archive(row)}>Archive</button></li>)}</ul> : <p>該当するデータはありません。上のフォームから最初の1件を登録できます。</p>}
    </section>
    {editing ? <section className="next-card next-card--wide"><header><h2>端末間で継続できる下書き</h2></header><p>{editing.canonical_title} / 基準 v{editing.version}</p><textarea value={draftText} onChange={(e) => {setDraftText(e.target.value);setSaveState(OWNER_SAVE_STATE.UNSAVED)}}/><div className="next-actions"><button className="next-primary" disabled={saveState===OWNER_SAVE_STATE.SAVING} onClick={saveDraft}>下書きを保存</button><button className="next-link" onClick={() => {if(saveState===OWNER_SAVE_STATE.SAVED||window.confirm("未保存の入力を破棄しますか？")){setEditing(null);setSaveState(OWNER_SAVE_STATE.SAVED)}}}>閉じる</button></div><p className="next-note">別端末が先に更新した場合は上書きせず、競合として停止します。</p></section> : null}
    <section className="next-card"><header><h2>Canonical timeline</h2></header>{state.timeline.length ? <ul className="next-list">{state.timeline.slice(0, 10).map((event) => <li key={event.id}><b>{event.event_type}</b><span>{new Date(event.created_at).toLocaleString("ja-JP")}</span></li>)}</ul> : <p>履歴はまだありません。</p>}</section>
    <section className="next-card"><header><h2>安全境界</h2></header><p>Private by default / Paid AI ¥0 / External Execution LOCKED</p></section>
    </div>
  </main>;
}
