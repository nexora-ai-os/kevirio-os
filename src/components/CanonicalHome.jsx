import { useCallback, useEffect, useMemo, useState } from "react";
import { createRevenueRepository } from "../repositories/revenueRepository.js";
import { createOfferOperationsRepository } from "../repositories/offerOperationsRepository.js";
import { buildCanonicalRevenueOverview } from "../domain/canonicalRevenueOverview.js";
import { buildProfitByCurrency, nextOperationAction } from "../domain/offerOperations.js";
import {
  Badge, Button, Card, EmptyState, EnvironmentBadge, ErrorState, KpiCard, Money,
  OwnerActionItem, PageHeader, SectionHeader, SkeletonGroup, Stack,
} from "../design-system/index.js";
import ProductionFoundationPanel from "./ProductionFoundationPanel.jsx";
import "./ProductionScreens.css";

const operationLabel = { owner_artifact_approval: "Content approval waiting", manual_package_ready: "Manual execution ready", performance_waiting: "Performance waiting", learning_ready: "Learning ready", closed: "Completed" };

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
    } catch { setError("Canonical Production data could not be retrieved."); }
  }, [revenueRepository, operationsRepository, ownerSession]);
  useEffect(() => { refresh(); }, [refresh]);

  const operation = state?.operations.operations?.[0] || null;
  const next = operation ? { title: "Continue Offer Operation", reason: nextOperationAction(operation), page: "campaign" } : state?.overview.nextAction;
  const actualCount = state?.overview.revenueRecordCount;
  return <main className="content kv-production-screen kv-home-screen">
    <Stack gap="8">
      <PageHeader title="Home" description={state?.context?.workspace?.name || "Production workspace"} actions={<EnvironmentBadge environment={state ? "production" : "locked"} />} />
      {error ? <ErrorState title="Production data unavailable" message={error} actionLabel="Retry" onAction={refresh} /> : null}
      {!state && !error ? <SkeletonGroup count={4} label="Loading Home" /> : null}
      <Card variant="decision" className="kv-morning-brief"><SectionHeader title="Morning Brief" /><p>Pending approvals: {state?.overview.pendingApprovals ?? "Unknown"}</p><p>Active operations: {state?.operations.operations.length ?? "Unknown"}</p><p>External execution remains locked.</p></Card>
      <section aria-labelledby="home-next-decision"><SectionHeader title="Next Decision" /><div id="home-next-decision" className="sr-only">Owner Action Queue</div>{next ? <OwnerActionItem title={next.title} description={next.reason} state="pending" actionLabel="Open" onAction={() => setPage(next.page)} metadata="One primary Owner action" /> : <EmptyState title="No Owner action" message="No canonical action is currently available." />}</section>
      <section aria-labelledby="home-business-health"><SectionHeader title="Business Health" /><div id="home-business-health" className="kv-kpi-grid"><KpiCard label="Offers" value={state?.operations.offers.length} state={state ? "actual" : "unknown"} freshness="Current repository snapshot" /><KpiCard label="Active operations" value={state?.operations.operations.length} state={state ? "actual" : "unknown"} freshness="Current repository snapshot" /><KpiCard label="Owner approvals" value={state?.overview.pendingApprovals} state="pending" freshness="Current repository snapshot" /><KpiCard label="Verified Actual" value={actualCount ? <Money value={state.overview.netActualMinor} currency="JPY" kind="actual" evidenceVerified locale="ja-JP" /> : null} state={actualCount ? "actual" : "unknown"} comparison="Evidence-backed only" /></div></section>
      <section className="kv-screen-grid" aria-label="Company status"><Card><SectionHeader title="Current Operation" actions={operation ? <Badge state={operation.status === "closed" ? "completed" : "pending"} /> : null} />{operation ? <><strong>{operationLabel[operation.status] || operation.status}</strong><p>{nextOperationAction(operation)}</p><Button variant="secondary" onClick={() => setPage("campaign")}>Open Operations</Button></> : <EmptyState title="No operation" message="No canonical Offer Operation is registered." />}</Card><Card><SectionHeader title="Verified Result" actions={<Badge state="actual" />} />{state?.profits.length ? state.profits.map((item) => <Money key={item.currency} value={item.netProfitMinor} currency={item.currency} kind="actual" evidenceVerified locale="ja-JP" />) : <EmptyState title="No verified result" message="Forecast and test values are excluded." />}</Card></section>
      <ProductionFoundationPanel ownerSession={ownerSession} ownerSupabaseClient={ownerSupabaseClient} />
    </Stack>
  </main>;
}
