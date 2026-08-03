import { Badge, Card, KpiCard, Money, SectionHeader } from "../design-system/index.js";

const PROVIDER_LABEL = Object.freeze({
  production_ready: "Production準備済み", dry_run_ready: "Dry Run準備済み",
  authorization_required: "認可待ち", credentials_missing: "設定不足",
  permission_missing: "権限不足", configuration_incomplete: "設定未完了",
  owner_locked: "Ownerロック", error: "Error", adapter_unavailable: "Unavailable",
});

function moneyList(items, valueKey) {
  if (!items.length) return null;
  return <span>{items.map((item) => <Money key={item.currency} value={item[valueKey]} currency={item.currency} kind="actual" evidenceVerified locale="ja-JP" />)}</span>;
}

export default function OwnerControlPlaneSummary({ state, nextAction }) {
  const operations = state?.operations;
  const revenue = state?.revenue;
  const activeOperation = operations?.operations?.find((item) => item.status !== "closed") || null;
  const actualCosts = (operations?.costs || []).filter((item) => item.value_type === "actual");
  const costsByCurrency = Object.values(actualCosts.reduce((all, item) => {
    const currency = item.currency;
    if (!currency) return all;
    all[currency] ||= { currency, amountMinor: 0 };
    all[currency].amountMinor += Number(item.amount_minor || 0);
    return all;
  }, {}));
  const verifiedByCurrency = Object.values((revenue?.revenue || []).reduce((all, item) => {
    const currency = item.currency;
    if (!currency) return all;
    all[currency] ||= { currency, amountMinor: 0 };
    all[currency].amountMinor += Number(item.gross_amount_minor ?? item.amount_minor ?? 0);
    return all;
  }, {}));
  const provider = operations?.connections?.[0] || null;
  const blocker = operations?.failures?.find((item) => item.owner_action)?.owner_action || null;
  const companyState = !state ? "Unknown" : activeOperation ? "運用中" : "有効な運用なし";

  return <section aria-labelledby="owner-control-plane-title">
    <SectionHeader title="Owner Control Plane" description="今日の判断、検証済み実績、コスト、利益、安全境界をCanonical dataだけで集約します。" />
    <div className="kv-kpi-grid" id="owner-control-plane-title">
      <KpiCard label="Company State" value={companyState} state={state ? "actual" : "unknown"} />
      <KpiCard label="Next Owner Action" value={nextAction?.title || null} state={nextAction ? "pending" : "unknown"} comparison={nextAction?.reason || "判断根拠なし"} />
      <KpiCard label="Verified Actual" value={moneyList(verifiedByCurrency,"amountMinor")} state={verifiedByCurrency.length ? "actual" : "unknown"} comparison="Evidence確認済みのみ" />
      <KpiCard label="Actual Cost" value={moneyList(costsByCurrency,"amountMinor")} state={costsByCurrency.length ? "actual" : "unknown"} comparison="value_type=actualのみ" />
      <KpiCard label="Net Profit" value={moneyList(state?.profits || [],"netProfitMinor")} state={state?.profits?.length ? "actual" : "unknown"} comparison="通貨別・検証済み" />
      <KpiCard label="Pending Approval" value={state?.overview?.pendingApprovals ?? null} state={state ? "pending" : "unknown"} />
      <KpiCard label="Active Offer / Workflow" value={activeOperation ? "進行中" : state ? "なし" : null} state={activeOperation ? "pending" : state ? "actual" : "unknown"} />
      <KpiCard label="AI Employee" value={null} state="unknown" comparison="Homeでは実行状態を推測しません" />
      <KpiCard label="Provider / Cost Guard" value={provider ? (PROVIDER_LABEL[provider.readiness] || "Unknown") : null} state={provider ? "conditional" : "unknown"} comparison="External Execution LOCKED" />
      <Card><span className="kv-kpi-card__label">Blocker</span><strong>{blocker || (state ? "確認できるBlockerなし" : "Unknown")}</strong><Badge state={blocker ? "blocked" : state ? "actual" : "unknown"} /></Card>
    </div>
  </section>;
}