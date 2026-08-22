import { useCallback, useEffect, useMemo, useState } from "react";
import { executeProtectedResearch, loadGlobalIntelligence } from "../../repositories/globalIntelligenceRepository.js";
import { friendlyError } from "./nextUx.js";
import "./next-workspace.css";

const DOMAINS = ["GLOBAL", "MARKET", "TREND", "COMPETITOR", "OPPORTUNITY", "AFFILIATE", "CONTENT", "WORK", "REGULATION"];

export default function GlobalIntelligenceWorkspace({ client }) {
  const [state, setState] = useState({ loading: true, sources: [], findings: [], actions: [], links: [] });
  const [message, setMessage] = useState("");
  const reload = useCallback(async () => {
    try {
      setState(current => ({ ...current, loading: true, error: null }));
      setState({ loading: false, error: null, ...(await loadGlobalIntelligence(client)) });
    } catch (error) {
      setState(current => ({ ...current, loading: false, error }));
    }
  }, [client]);
  useEffect(() => { reload(); }, [reload]);
  const grouped = useMemo(() => Object.fromEntries(DOMAINS.map(domain => [domain, state.findings.filter(item => item.research_domain === domain && item.status === "ACTIVE")])), [state.findings]);

  const submit = async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setMessage("");
    try {
      const url = new URL(String(data.get("url")));
      await executeProtectedResearch(client, {
        workspaceId: state.workspaceId,
        source: {
          canonicalUrl: url.toString(), sourceName: String(data.get("source_name")), sourceDomain: url.hostname.toLowerCase(),
          sourceType: String(data.get("source_type")), reliabilityClass: String(data.get("reliability")), costClass: "FREE_CONFIRMED",
          limitations: "Owner-reviewed public source; no credentials or private content.",
        },
        findings: [{
          domain: String(data.get("domain")), market: String(data.get("market") || "") || null,
          countryCode: String(data.get("country") || "") || null, languageCode: "ja", observedAt: new Date().toISOString(),
          freshnessExpiresAt: new Date(Date.now() + 7 * 86400000).toISOString(), statement: String(data.get("statement")),
          truthClass: "WEB_SOURCE", confidence: Number(data.get("confidence")),
          provenance: { source_url: url.toString(), capture_method: "OWNER_EXPLICIT", evidence_status: "WEB_SOURCE_NOT_ACTUAL" },
        }],
      });
      form.reset();
      setMessage("Source・Finding・fit actionを保護されたserver経路で保存しました。");
      await reload();
    } catch (error) {
      setMessage(friendlyError(error, "Researchを保存できませんでした。FREE source・入力内容・認証状態を確認してください。"));
    }
  };

  return <main className="next-workspace">
    <header className="next-header"><div><span>GLOBAL INTELLIGENCE</span><h1>Global Intelligence</h1><p>SourceからFinding、Opportunity、Fit、内部アクションまでをPersonal Workspaceで追跡します。</p></div><div className="next-header__state"><span className="next-state next-state--blocked">External Execution LOCKED</span><small>Paid AI ¥0</small></div></header>
    <div className="next-grid">
      <section className="next-card next-card--wide"><header><h2>FREE researchを記録</h2></header>
        <form className="next-form" onSubmit={submit}>
          <label>Source URL<input name="url" type="url" required pattern="https://.*" /></label>
          <label>Source名<input name="source_name" required maxLength={300} /></label>
          <label>Source種別<select name="source_type"><option>OFFICIAL_GOVERNMENT</option><option>OFFICIAL_COMPANY</option><option>PROVIDER_OFFICIAL</option><option>NEWS</option><option>MARKETPLACE</option><option>PUBLIC_SOCIAL</option><option>PUBLIC_COMMUNITY</option><option>SEARCH_SIGNAL</option><option>OTHER_WEB</option></select></label>
          <label>信頼性<select name="reliability"><option>PRIMARY</option><option>HIGH</option><option>MEDIUM</option><option>LOW</option><option>UNKNOWN</option></select></label>
          <label>Domain<select name="domain">{DOMAINS.map(domain => <option key={domain}>{domain}</option>)}</select></label>
          <label>Market<input name="market" maxLength={200} /></label>
          <label>Country<input name="country" pattern="[A-Z]{2}" placeholder="JP" /></label>
          <label>Confidence<input name="confidence" type="number" min="0" max="1" step="0.01" defaultValue="0.7" required /></label>
          <label className="next-span">観測したFinding<textarea name="statement" required maxLength={8000} /></label>
          <button className="next-primary" disabled={!state.workspaceId}>server-side protected pathで保存</button>
        </form>
        <p className="next-note">Browser direct DML 0。PAID/UNKNOWN source、秘密情報、L3/L4、外部実行は拒否されます。</p>{message ? <p role="status">{message}</p> : null}
      </section>
      <section className="next-card next-card--wide"><header><h2>Source → Finding → Opportunity</h2></header>{state.error ? <p role="alert">Global Intelligenceを読み込めません。<button onClick={reload}>再試行</button></p> : state.findings.length ? <div className="next-table" role="table">{DOMAINS.map(domain => <div role="row" key={domain}><b>{domain}</b><span role="cell">{grouped[domain].length}</span><span role="cell">{grouped[domain][0]?.truth_class || "未登録"}</span><span role="cell">{grouped[domain][0]?.freshness_expires_at ? new Date(grouped[domain][0].freshness_expires_at).toLocaleDateString("ja-JP") : "Unknown"}</span></div>)}</div> : <p>Findingはまだありません。上のフォームからOwner確認済みFREE sourceを登録できます。</p>}</section>
      <section className="next-card"><header><h2>Fit / Internal actions</h2></header><b>{state.actions.length}</b><p>L0–L2のみ。外部実行はありません。</p></section>
      <section className="next-card"><header><h2>Cross-domain links</h2></header><b>{state.links.length}</b><p>M029 resolverでStrategy / Work / Affiliate / Contentへ接続します。</p></section>
    </div>
  </main>;
}
