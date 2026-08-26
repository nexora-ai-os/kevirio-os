import test from "node:test";
import assert from "node:assert/strict";
import { buildAffiliateCycleReply, formatAffiliateCycleContext, isAffiliateCycleStatusQuery } from "../../server/affiliateCycleAssistantContext.js";

const cycle = Object.freeze({
  program: { id: "63a93b0d-4456-4361-ac35-7b4a08afc319", name: "RingConn", status: "UNKNOWN" },
  research: { id: "research", status: "ACTIVE", truthClass: "AI_RECOMMENDATION" },
  strategy: { id: "strategy", status: "CONFIRMED", researchId: "research" },
  content: { id: "content", status: "ACTIVE", executionState: "READY_FOR_REVIEW" },
  publication: { count: 0, latestStatus: "NOT_RECORDED" },
  performance: { count: 0, latest: null },
  revenueCandidate: { count: 0, latestStatus: "NONE" },
  evidence: { count: 0, latestStatus: "NONE" },
  actualRevenue: { count: 0, latest: null },
  improvement: "WAITING_FOR_REAL_EXTERNAL_RESULT",
  nextAction: "Owner reviews Content and manually publishes",
  truth: { paidAiJpy: 0, paidFallback: "OFF", externalExecution: "LOCKED", aiOutputIsEvidence: false },
});

test("exact Affiliate cycle context preserves canonical waiting and truth boundaries", () => {
  const text = formatAffiliateCycleContext(cycle);
  for (const expected of ["RingConn", "Research: ACTIVE", "Strategy: CONFIRMED", "execution=READY_FOR_REVIEW", "Publication: NOT_RECORDED", "Performance: UNKNOWN; no real result", "Revenue Candidate: 0", "Evidence: 0", "Actual Revenue: 0", "WAITING_FOR_REAL_EXTERNAL_RESULT", "Paid fallback OFF", "External Execution LOCKED"]) assert.match(text, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("cycle questions receive deterministic canonical answers without fabricated results", () => {
  for (const query of ["RingConnどうなってる？", "次何すればいい？", "投稿した？", "成果出た？", "売上どう？"]) assert.equal(isAffiliateCycleStatusQuery(query), true);
  assert.match(buildAffiliateCycleReply(cycle, "投稿した？"), /まだ投稿・公開記録はありません/);
  assert.match(buildAffiliateCycleReply(cycle, "成果出た？"), /実成果はまだ記録されていません/);
  assert.match(buildAffiliateCycleReply(cycle, "売上どう？"), /Actual Revenueは0件/);
  assert.match(buildAffiliateCycleReply(cycle, "次何すればいい？"), /Owner reviews Content and manually publishes/);
});
