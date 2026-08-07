import test from "node:test";
import assert from "node:assert/strict";
import {
  aggregateAffiliateKpis, buildIntelligenceGraph, buildOwnerDailyBrief, detectAffiliateDuplicates,
  evaluateCompliance, generateAffiliateTasks, marketplaceAsset, rankAffiliatePriorities,
  scoreAffiliateOpportunity, transitionLifecycle, validateAiExecution, validateTruthValue,
} from "../../src/domain/affiliateIntelligenceV2.js";

test("truth model keeps Actual evidence-backed and Forecast explicit", () => {
  assert.equal(validateTruthValue({ truthClass: "Actual" }).valid, false);
  assert.equal(validateTruthValue({ truthClass: "Actual", evidenceReference: "ev-1", sourceReference: "asp-statement", recordedAt: "2026-08-05", recordedBy: "owner", auditEvent: "event-1" }).valid, true);
  assert.equal(validateTruthValue({ truthClass: "Forecast", generatedAt: "2026-08-05", sourceData: ["actual-1"], assumptions: ["stable CVR"], confidence: .6, modelVersion: "v2" }).valid, true);
  assert.equal(validateTruthValue({ truthClass: "Mock" }).valid, false);
});

test("lifecycle transitions are centralized and cannot skip Owner Approval", () => {
  assert.equal(transitionLifecycle("affiliate", "content_planning", "owner_approval").ok, true);
  assert.equal(transitionLifecycle("affiliate", "content_planning", "manual_execution_ready").code, "TRANSITION_DENIED");
});

test("scoring is deterministic and ranking pushes blocked work below actionable work", () => {
  const score = scoreAffiliateOpportunity({ profitability: 90, competition: 30, seoFit: 80, snsFit: 60, contentFit: 85, conversionPotential: 80, complianceRisk: 10, evidenceQuality: 90, effort: 30, timeToRevenue: 20, strategicFit: 90 });
  assert.equal(score.truthClass, "Inference");
  assert.equal(score.rationale.weightsVersion, "affiliate-score-v2.0.0");
  const ranked = rankAffiliatePriorities([{ id: "blocked", metrics: {}, blocked: true }, { id: "ready", metrics: {}, blocked: false }]);
  assert.equal(ranked[0].id, "ready");
});

test("task generation is idempotent and all generated tasks remain manual", () => {
  const first = generateAffiliateTasks({ id: "program-1" });
  const second = generateAffiliateTasks({ id: "program-1" }, first);
  assert.ok(first.length > 10); assert.equal(second.length, 0);
  assert.ok(first.every((task) => task.externalExecution === false && task.ownerRemovable));
});

test("compliance guard blocks missing disclosure and avoids legal conclusions", () => {
  const result = evaluateCompliance({ body: "必ず痩せる", claimSource: "source" });
  assert.equal(result.state, "BLOCKED"); assert.equal(result.legalConclusion, false);
});

test("duplicate detection covers same-kind normalized values", () => {
  assert.deepEqual(detectAffiliateDuplicates([{ id: "1", kind: "tracking_url", value: "HTTPS://EXAMPLE.COM/A" }, { id: "2", kind: "tracking_url", value: "https://example.com/a" }]).map((item) => item.duplicateId), ["2"]);
});

test("KPI separates Actual from Forecast and uses canonical cost records", () => {
  const kpi = aggregateAffiliateKpis({
    performance: [{ clicks: 10, conversions: 2 }],
    revenue: [{ gross_amount_minor: 1000, cost_amount_minor: 100, net_amount_minor: 900, recognized_at: "2026-08-05", campaign_id: "campaign-1" }],
    costs: [
      { amount_minor: 250, value_type: "actual", occurred_at: "2026-08-05", campaign_id: "campaign-1" },
      { amount_minor: 500, value_type: "forecast", occurred_at: "2026-08-06", campaign_id: "campaign-1" },
      { amount_minor: 750, value_type: "test", occurred_at: "2026-08-07", campaign_id: "campaign-1" },
    ],
  });
  assert.deepEqual(
    { actual: kpi.actualRevenue, internalCost: kpi.revenueInternalCost, netRevenue: kpi.netRevenue, actualCost: kpi.actualCost, forecastCost: kpi.forecastCost, testCost: kpi.testCost, forecastRevenue: kpi.forecastRevenue, profit: kpi.netProfit, roi: kpi.roi },
    { actual: 1000, internalCost: 100, netRevenue: 900, actualCost: 250, forecastCost: 500, testCost: 750, forecastRevenue: null, profit: 650, roi: 2.6 },
  );
  const noRevenue = aggregateAffiliateKpis({ costs: [{ amount_minor: 250, value_type: "actual", occurred_at: "2026-08-05", campaign_id: "campaign-1" }] });
  assert.equal(noRevenue.actualRevenue, "Unknown");
  assert.equal(noRevenue.netRevenue, "Unknown");
  assert.equal(noRevenue.netProfit, "Unknown");
  const noActualCost = aggregateAffiliateKpis({ revenue: [{ gross_amount_minor: 1000, cost_amount_minor: 100, net_amount_minor: 900, recognized_at: "2026-08-05", campaign_id: "campaign-1" }] });
  assert.equal(noActualCost.actualCost, "Unknown");
  assert.equal(noActualCost.netProfit, "Unknown");
  assert.equal(noActualCost.roi, null);
});

test("Daily Brief returns at most three actions and keeps execution locked", () => {
  const opportunities = Array.from({ length: 6 }, (_, index) => ({ id: String(index), title: `item-${index}`, metrics: { profitability: 90 - index }, ownerMinutes: 5 }));
  const brief = buildOwnerDailyBrief({ opportunities, generatedAt: "2026-08-05T00:00:00Z" });
  assert.equal(brief.actions.length, 3); assert.equal(brief.externalExecution, "LOCKED");
});

test("AI boundary allows one retry and one meeting round only", () => {
  const base = { role: "Affiliate Strategist", retryCount: 1, meetingRounds: 1, externalExecution: false, promptVersion: "1", promptHash: "abc", model: "test-model", temperature: 0 };
  assert.equal(validateAiExecution(base).valid, true);
  assert.equal(validateAiExecution({ ...base, retryCount: 2 }).valid, false);
});

test("graph is derived from canonical relations and marketplace remains internal", () => {
  const graph = buildIntelligenceGraph({ id: "offer-1", title: "RingConn" }, { Product: [{ id: "product-1", name: "RingConn" }], Evidence: [{ id: "evidence-1" }] });
  assert.equal(graph.nodes.length, 3); assert.equal(graph.edges.length, 2);
  const asset = marketplaceAsset({ title: "Review template" });
  assert.equal(asset.exportReady, false); assert.equal(asset.publicMarketplace, false); assert.equal(asset.paymentEnabled, false);
});
