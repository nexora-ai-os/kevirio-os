import fs from "node:fs/promises";
import { mockMarketSignals } from "../src/data/mockMarketSignals.js";
import { buildMarketIntelligenceFoundation } from "../src/services/marketIntelligenceEngine.js";
import { buildMarketIntelligenceViewModel } from "../src/services/marketIntelligenceAdapter.js";
import { createMarketDecision } from "../src/services/marketDecisionService.js";
import {
  CAMPAIGN_HANDOFF_STORAGE_KEY,
  createCampaignRecommendationHandoff,
  getCampaignHandoffKey,
  validateCampaignRecommendationHandoff,
} from "../src/services/campaignRecommendationHandoffService.js";

const EVALUATION_TIME = "2026-07-14T12:00:00.000Z";
const DECIDED_AT = "2026-07-15T00:00:00.000Z";

function assert(name, condition, details = "") {
  if (!condition) throw new Error(`${name}${details ? `: ${details}` : ""}`);
}

function fixture() {
  const foundation = buildMarketIntelligenceFoundation(JSON.parse(JSON.stringify(mockMarketSignals)), Date.parse(EVALUATION_TIME));
  const recommendation = buildMarketIntelligenceViewModel(foundation, EVALUATION_TIME).recommendations[0];
  const ownerDecision = createMarketDecision({
    opportunityId: recommendation.opportunityId,
    opportunityVersion: recommendation.opportunityVersion,
    marketId: recommendation.marketId,
    correlationId: recommendation.correlationId,
    decision: "approved",
    reasonCode: "OWNER_SELECTED_FOR_MOCK_CAMPAIGN",
    decidedAt: DECIDED_AT,
  }, DECIDED_AT);
  return { recommendation, ownerDecision };
}

const tests = [
  ["Approved owner decision creates handoff", () => {
    const { recommendation, ownerDecision } = fixture();
    const handoff = createCampaignRecommendationHandoff(recommendation, ownerDecision, DECIDED_AT);
    assert("valid", validateCampaignRecommendationHandoff(handoff, ownerDecision).valid);
  }],
  ["Non-approved owner decision is rejected", () => {
    const { recommendation, ownerDecision } = fixture();
    const holdDecision = { ...ownerDecision, decision: "hold" };
    const handoff = createCampaignRecommendationHandoff(recommendation, holdDecision, DECIDED_AT);
    assert("reject", validateCampaignRecommendationHandoff(handoff, holdDecision).valid === false);
  }],
  ["Deterministic handoff ID is stable", () => {
    const { recommendation, ownerDecision } = fixture();
    const first = createCampaignRecommendationHandoff(recommendation, ownerDecision, DECIDED_AT);
    const second = createCampaignRecommendationHandoff(recommendation, ownerDecision, DECIDED_AT);
    assert("same", first.handoffId === second.handoffId && first.handoffKey === second.handoffKey);
  }],
  ["Handoff key follows frozen material", () => {
    const { recommendation, ownerDecision } = fixture();
    const handoff = createCampaignRecommendationHandoff(recommendation, ownerDecision, DECIDED_AT);
    assert("key", handoff.handoffKey === getCampaignHandoffKey(handoff.recommendationId, ownerDecision.decisionId));
  }],
  ["Correlation ID is preserved", () => {
    const { recommendation, ownerDecision } = fixture();
    const handoff = createCampaignRecommendationHandoff(recommendation, ownerDecision, DECIDED_AT);
    assert("correlation", handoff.correlationId === recommendation.correlationId);
  }],
  ["Forecast is copied, not recalculated", () => {
    const { recommendation, ownerDecision } = fixture();
    const handoff = createCampaignRecommendationHandoff(recommendation, ownerDecision, DECIDED_AT);
    assert("forecast", handoff.forecastRevenueRange.base === recommendation.primary.forecastRange.base);
  }],
  ["Input mutation does not occur", () => {
    const { recommendation, ownerDecision } = fixture();
    const before = JSON.stringify(recommendation);
    createCampaignRecommendationHandoff(recommendation, ownerDecision, DECIDED_AT);
    assert("mutation", JSON.stringify(recommendation) === before);
  }],
  ["Production true is rejected", () => {
    const { recommendation, ownerDecision } = fixture();
    const handoff = { ...createCampaignRecommendationHandoff(recommendation, ownerDecision, DECIDED_AT), productionExecution: true };
    assert("prod", validateCampaignRecommendationHandoff(handoff, ownerDecision).valid === false);
  }],
  ["External true is rejected", () => {
    const { recommendation, ownerDecision } = fixture();
    const handoff = { ...createCampaignRecommendationHandoff(recommendation, ownerDecision, DECIDED_AT), externalExecution: true };
    assert("external", validateCampaignRecommendationHandoff(handoff, ownerDecision).valid === false);
  }],
  ["Actual Revenue field is rejected", () => {
    const { recommendation, ownerDecision } = fixture();
    const handoff = { ...createCampaignRecommendationHandoff(recommendation, ownerDecision, DECIDED_AT), actualRevenue: 1 };
    assert("actual", validateCampaignRecommendationHandoff(handoff, ownerDecision).valid === false);
  }],
  ["Ledger append true is rejected", () => {
    const { recommendation, ownerDecision } = fixture();
    const handoff = { ...createCampaignRecommendationHandoff(recommendation, ownerDecision, DECIDED_AT), ledgerAppend: true };
    assert("ledger", validateCampaignRecommendationHandoff(handoff, ownerDecision).valid === false);
  }],
  ["Approval confirmed true is rejected", () => {
    const { recommendation, ownerDecision } = fixture();
    const handoff = { ...createCampaignRecommendationHandoff(recommendation, ownerDecision, DECIDED_AT), approvalConfirmed: true };
    assert("approval", validateCampaignRecommendationHandoff(handoff, ownerDecision).valid === false);
  }],
  ["Schema mismatch is rejected", () => {
    const { recommendation, ownerDecision } = fixture();
    const handoff = { ...createCampaignRecommendationHandoff(recommendation, ownerDecision, DECIDED_AT), schemaVersion: "1.0.0" };
    assert("schema", validateCampaignRecommendationHandoff(handoff, ownerDecision).valid === false);
  }],
  ["Storage key is frozen", () => {
    assert("storage", CAMPAIGN_HANDOFF_STORAGE_KEY === "kevirio:campaign-handoffs:v2");
  }],
  ["Service has no external communication", async () => {
    const source = await fs.readFile(new URL("../src/services/campaignRecommendationHandoffService.js", import.meta.url), "utf8");
    assert("no fetch", !source.includes("fetch("));
    assert("no axios", !source.includes("axios"));
    assert("no websocket", !source.includes("WebSocket"));
  }],
  ["Service does not import legacy campaign engine", async () => {
    const source = await fs.readFile(new URL("../src/services/campaignRecommendationHandoffService.js", import.meta.url), "utf8");
    assert("no legacy", !source.includes("campaignEngine") && !source.includes("revenueCampaignService"));
  }],
];

let passed = 0;
const failures = [];
for (const [name, run] of tests) {
  try {
    await run();
    passed += 1;
    console.log(`PASS ${name}`);
  } catch (error) {
    failures.push({ name, error });
    console.error(`FAIL ${name}`);
    console.error(`  ${error.message}`);
  }
}

console.log(`\nCampaign Recommendation Handoff verification: ${passed}/${tests.length} passed`);
if (failures.length) process.exitCode = 1;
