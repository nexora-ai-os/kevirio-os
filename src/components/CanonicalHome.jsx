import { useCallback, useEffect, useMemo, useState } from "react";
import { createRevenueRepository } from "../repositories/revenueRepository.js";
import { createOfferOperationsRepository } from "../repositories/offerOperationsRepository.js";
import { buildCanonicalRevenueOverview } from "../domain/canonicalRevenueOverview.js";
import { buildProfitByCurrency, nextOperationAction } from "../domain/offerOperations.js";
import { deriveNextOwnerAction } from "../domain/affiliateIntelligence.js";
import {
  Badge, Button, Card, EmptyState, EnvironmentBadge, ErrorState, KpiCard, Money,
  OwnerActionItem, PageHeader, SectionHeader, SkeletonGroup, Stack,
} from "../design-system/index.js";
import ProductionFoundationPanel from "./ProductionFoundationPanel.jsx";
import CompanyOperatingCycle from "./CompanyOperatingCycle.jsx";
import OwnerControlPlaneSummary from "./OwnerControlPlaneSummary.jsx";
import "./ProductionScreens.css";

const operationLabel = { owner_artifact_approval: "コンテンツ承認待ち", manual_package_ready: "手動実行の準備完了", performance_waiting: "実績待ち", learning_ready: "学習準備完了", closed: "完了" };

export default function CanonicalHome({ ownerSession, ownerSupabaseClient, setPage }) {
  const revenueRepository = useMemo(() => createRevenueRepository(ownerSupabaseClient), [ownerSupabaseClient]);
  const operationsRepository = useMemo(() => createOfferOperationsRepository(ownerSupabaseClient), [ownerSupabaseClient]);
  const [state, setState] = useState(null);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    try {
      const context = await revenueRepository.loadContext(ownerSession);
      const [revenue, operations] = await Promise.all([revenueRepository.loadSnapshot(context.workspace.id), operationsRepository.loadSnapshot(context.workspace.id)]);
      setState({ context, revenue, operations, overview: buildCanonicalRevenueOverview(revenue), profits: buildProfitByCurrency({ revenueRecords: revenue.revenue, costRecords: operations.costs }) });
      setError("");
    } catch { setError("Productionデータを取得できませんでした。"); }
  }, [revenueRepository, operationsRepository, ownerSession]);
  useEffect(() => { refresh(); }, [refresh]);

  const operation = state?.operations.operations?.[0] || null;
  const affiliateNext = state ? deriveNextOwnerAction(state.operations) : null;
  const next = affiliateNext ? { title: affiliateNext.title, reason: affiliateNext.message, page: affiliateNext.stage === "offer_registration" ? "campaign" : "affiliate" } : state?.overview.nextAction;
  const actualCount = state?.overview.revenueRecordCount;
  return <main className="content kv-production-screen kv-home-screen">
    <Stack gap="8">
      <PageHeader eyebrow="OWNER COMMAND CENTER" title="おはようございます、Owner" description={state?.context?.workspace?.name ? `${state.context.workspace.name} の現在状況と、次に必要な判断です。` : "会社の重要な判断と稼働状況を、ひとつの画面で確認できます。"} actions={<EnvironmentBadge environment={state ? "production" : "locked"} />} />
      {error ? <ErrorState title="Productionデータを表示できません" message={error} actionLabel="再試行" onAction={refresh} /> : null}
      {!state && !error ? <SkeletonGroup count={4} label="ホームを読み込み中" /> : null}
      <Card variant="decision" className="kv-morning-brief"><SectionHeader title="本日の状況" description="Ownerの判断が必要な項目を優先して表示します。" /><p>承認待ち：{state?.overview.pendingApprovals ?? "未取得"}</p><p>進行中の運用：{state?.operations.operations.length ?? "未取得"}</p><p>外部実行はロックされています。</p></Card>
      <section aria-labelledby="home-next-decision"><SectionHeader title="次に確認すること" /><div id="home-next-decision" className="sr-only">Ownerアクション一覧</div>{next ? <OwnerActionItem title={next.title} description={next.reason} state="pending" actionLabel="確認する" onAction={() => setPage(next.page)} metadata="最優先のOwnerアクション" /> : <EmptyState title="確認が必要な項目はありません" message="現在利用できる正式なOwnerアクションはありません。" />}</section>
      <section aria-labelledby="home-business-health"><SectionHeader title="事業の状態" /><div id="home-business-health" className="kv-kpi-grid"><KpiCard label="オファー" value={state?.operations.offers.length} state={state ? "actual" : "unknown"} freshness="最新のRepositoryスナップショット" /><KpiCard label="進行中の運用" value={state?.operations.operations.length} state={state ? "actual" : "unknown"} freshness="最新のRepositoryスナップショット" /><KpiCard label="Owner承認" value={state?.overview.pendingApprovals} state="pending" freshness="最新のRepositoryスナップショット" /><KpiCard label="検証済み実績" value={actualCount ? <Money value={state.overview.netActualMinor} currency="JPY" kind="actual" evidenceVerified locale="ja-JP" /> : null} state={actualCount ? "actual" : "unknown"} comparison="Evidence確認済みのみ" /></div></section>
      <section className="kv-screen-grid" aria-label="会社の状態"><Card><SectionHeader title="現在のオペレーション" actions={operation ? <Badge state={operation.status === "closed" ? "completed" : "pending"} /> : null} />{operation ? <><strong>{operationLabel[operation.status] || operation.status}</strong><p>{nextOperationAction(operation)}</p><Button variant="secondary" onClick={() => setPage("campaign")}>オペレーションを開く</Button></> : <EmptyState title="運用はありません" message="正式なオファー運用は登録されていません。" />}</Card><Card><SectionHeader title="検証済みの成果" actions={<Badge state="actual" label="実績" />} />{state?.profits.length ? state.profits.map((item) => <Money key={item.currency} value={item.netProfitMinor} currency={item.currency} kind="actual" evidenceVerified locale="ja-JP" />) : <EmptyState title="検証済み成果はありません" message="予測値とテスト値は除外されています。" />}</Card></section>
      <OwnerControlPlaneSummary state={state} nextAction={next} />
      <CompanyOperatingCycle operation={operation} revenue={state?.revenue} operations={state?.operations} />
      <ProductionFoundationPanel ownerSession={ownerSession} ownerSupabaseClient={ownerSupabaseClient} />
    </Stack>
  </main>;
}
