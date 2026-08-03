import { useEffect, useMemo, useState } from "react";
import { createRevenueRepository } from "../repositories/revenueRepository.js";
import { createOfferOperationsRepository } from "../repositories/offerOperationsRepository.js";
import { mapCanonicalActualAnalytics } from "../domain/revenueAnalytics.js";
import { buildProfitByCurrency } from "../domain/offerOperations.js";
import { Badge, Card, DataReadiness, EmptyState, EnvironmentBadge, ErrorState, KpiCard, Money, PageHeader, SectionHeader, SkeletonGroup, Stack, Table } from "../design-system/index.js";
import "./ProductionScreens.css";

const laneLabel = { service: "サービス", affiliate: "アフィリエイト", digital_product: "デジタル商品", media: "メディア" };
const analysisModules = ["売上推移", "利益", "コスト", "Conversion", "Channel", "AI社員の影響", "Evidence品質"];

export default function Analytics({ ownerSupabaseClient, ownerSession }) {
  const revenueRepository = useMemo(() => createRevenueRepository(ownerSupabaseClient), [ownerSupabaseClient]);
  const operationsRepository = useMemo(() => createOfferOperationsRepository(ownerSupabaseClient), [ownerSupabaseClient]);
  const [actual, setActual] = useState(null); const [profit, setProfit] = useState([]); const [error, setError] = useState("");
  useEffect(() => { let active = true; (async () => { try { const context = await revenueRepository.loadContext(ownerSession); const [revenue, operations] = await Promise.all([revenueRepository.loadSnapshot(context.workspace.id), operationsRepository.loadSnapshot(context.workspace.id)]); if (active) { setActual(mapCanonicalActualAnalytics(revenue.revenue, revenue.campaigns, revenue.evidence)); setProfit(buildProfitByCurrency({ revenueRecords: revenue.revenue, costRecords: operations.costs })); setError(""); } } catch { if (active) setError("実績と利益のデータを取得できませんでした。"); } })(); return () => { active = false; }; }, [revenueRepository, operationsRepository, ownerSession]);
  const columns = [{ key: "campaign", label: "キャンペーン" }, { key: "lane", label: "収益レーン", render: (row) => laneLabel[row.lane] || "売上" }, { key: "period", label: "期間" }, { key: "evidenceStatus", label: "Evidence", render: (row) => <Badge state={row.evidenceStatus === "検証済み" ? "actual" : "unknown"} label={row.evidenceStatus} /> }, { key: "net", label: "検証済み純額", render: (row) => <Money value={row.netMinor} currency={row.currency} kind="actual" evidenceVerified locale="ja-JP" /> }];
  const hasVerifiedData = Boolean(actual?.rows.length);
  return <main className="content kv-production-screen kv-archetype-analytics"><Stack gap="8">
    <PageHeader variant="standard" accent="blue" eyebrow="EVIDENCE INTELLIGENCE" title="インサイト" description="Evidenceで検証されたRepository出力だけを、意思決定可能な情報へ変換します。" actions={<EnvironmentBadge environment={actual ? "production" : "locked"} />}/>
    {error ? <ErrorState title="インサイトを表示できません" message={error} /> : null}
    {!actual && !error ? <SkeletonGroup count={3} label="インサイトを読み込み中" /> : null}
    {actual && !hasVerifiedData ? <><DataReadiness state="locked" current="検証済み実績レコードなし" required="EvidenceとOwner承認を満たすActual Revenue" nextAction="売上画面でEvidence候補と承認状態を確認" /><section><SectionHeader title="分析モジュール" description="必要条件を満たすまで架空Chartは表示しません。" /><div className="kv-analysis-modules">{analysisModules.map((name) => <Card key={name} variant="status"><h3>{name}</h3><Badge state="locked" label="条件未達" /><p>検証済み実績データの登録後に利用できます。</p></Card>)}</div></section></> : null}
    {hasVerifiedData ? <div className="kv-kpi-grid"><KpiCard label="実績総額" value={<Money value={actual.grossMinor} currency="JPY" kind="actual" evidenceVerified locale="ja-JP" />} state="actual" comparison="検証済みEvidenceのみ" /><KpiCard label="収益コスト" value={<Money value={actual.costMinor} currency="JPY" kind="actual" evidenceVerified locale="ja-JP" />} state="actual" /><KpiCard label="実績純額" value={<Money value={actual.netMinor} currency="JPY" kind="actual" evidenceVerified locale="ja-JP" />} state="actual" /><KpiCard label="最終検証日" value={actual.lastVerifiedAt ? new Date(actual.lastVerifiedAt).toLocaleDateString("ja-JP") : null} state={actual.lastVerifiedAt ? "actual" : "unknown"} /></div> : null}
    <section><SectionHeader title="通貨別の検証済み利益" description="予測、テスト、Evidence保留中の値は除外しています。" />{profit.length ? <div className="kv-card-list">{profit.map((row) => <KpiCard key={row.currency} label={`${row.currency} 検証済み利益`} value={<Money value={row.netProfitMinor} currency={row.currency} kind="actual" evidenceVerified locale="ja-JP" />} state="actual" comparison="検証済み総額 − 収益コスト − 実績運用コスト" />)}</div> : <EmptyState title="検証済み利益はまだありません" message="未接続や未検証を0として表示しません。" />}</section>
    <section><SectionHeader title="検証済みレコード" /><Table caption="検証済み実績売上レコード" columns={columns} rows={actual?.rows || []} loading={!actual && !error} emptyTitle="検証済み実績はありません" emptyMessage="表示にはEvidenceとOwner承認が必要です。" /></section>
  </Stack></main>;
}
