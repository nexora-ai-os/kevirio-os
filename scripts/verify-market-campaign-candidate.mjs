import fs from "node:fs/promises";
import { mockMarketSignals } from "../src/data/mockMarketSignals.js";
import { buildMarketIntelligenceFoundation } from "../src/services/marketIntelligenceEngine.js";
import { buildMarketIntelligenceViewModel } from "../src/services/marketIntelligenceAdapter.js";
import { createMarketDecision } from "../src/services/marketDecisionService.js";
import { createCampaignRecommendationHandoff } from "../src/services/campaignRecommendationHandoffService.js";
import {
  CAMPAIGN_CANDIDATE_STORAGE_KEY,
  CONTENT_BRIEF_CANDIDATE_STORAGE_KEY,
  createCampaignDraftCandidate,
  createContentBriefCandidate,
  getCampaignCandidateId,
  getContentBriefId,
  validateCampaignDraftCandidate,
  validateContentBriefCandidate,
} from "../src/services/marketCampaignCandidateService.js";

const EVALUATION_TIME = "2026-07-14T12:00:00.000Z";
const CREATED_AT = "2026-07-15T00:00:00.000Z";

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
    decidedAt: CREATED_AT,
  }, CREATED_AT);
  const handoff = createCampaignRecommendationHandoff(recommendation, ownerDecision, CREATED_AT);
  const campaignCandidate = createCampaignDraftCandidate(handoff, CREATED_AT);
  const contentBrief = createContentBriefCandidate(campaignCandidate, CREATED_AT);
  return { handoff, campaignCandidate, contentBrief };
}

const tests = [
  ["Campaign Candidate validates", () => {
    assert("valid", validateCampaignDraftCandidate(fixture().campaignCandidate).valid);
  }],
  ["Content Brief validates", () => {
    assert("valid", validateContentBriefCandidate(fixture().contentBrief).valid);
  }],
  ["Same handoff creates same Campaign Candidate ID", () => {
    const { handoff } = fixture();
    assert("same", createCampaignDraftCandidate(handoff, CREATED_AT).campaignCandidateId === createCampaignDraftCandidate(handoff, CREATED_AT).campaignCandidateId);
  }],
  ["Campaign Candidate ID uses handoff ID", () => {
    const { handoff, campaignCandidate } = fixture();
    assert("id", campaignCandidate.campaignCandidateId === getCampaignCandidateId(handoff.handoffId));
  }],
  ["Content Brief ID uses Campaign Candidate ID", () => {
    const { campaignCandidate, contentBrief } = fixture();
    assert("id", contentBrief.contentBriefId === getContentBriefId(campaignCandidate.campaignCandidateId));
  }],
  ["Campaign Candidate is mock only", () => {
    const { campaignCandidate } = fixture();
    assert("mock", campaignCandidate.dataMode === "mock" && campaignCandidate.isMock === true);
  }],
  ["Content Brief is mock only", () => {
    const { contentBrief } = fixture();
    assert("mock", contentBrief.dataMode === "mock" && contentBrief.isMock === true);
  }],
  ["Campaign Candidate has no production, external, publish, ledger, actual revenue", () => {
    const c = fixture().campaignCandidate;
    assert("safe", c.productionExecution === false && c.externalExecution === false && c.publishEnabled === false && c.ledgerAppend === false && c.actualRevenueConnected === false);
  }],
  ["Content Brief has no production, external, publish, ledger", () => {
    const b = fixture().contentBrief;
    assert("safe", b.productionExecution === false && b.externalExecution === false && b.publishEnabled === false && b.ledgerAppend === false);
  }],
  ["Forecast is copied from handoff only", () => {
    const { handoff, campaignCandidate } = fixture();
    assert("forecast", campaignCandidate.forecastRevenueRange.base === handoff.forecastRevenueRange.base);
  }],
  ["No score or ranking fields are present", () => {
    const text = JSON.stringify(fixture());
    assert("no score", !text.includes("finalScore") && !text.includes("baseScore") && !text.includes("rank"));
  }],
  ["Content Brief has prohibitedClaims", () => {
    assert("claims", fixture().contentBrief.prohibitedClaims.length >= 3);
  }],
  ["Content Brief has riskNotes", () => {
    assert("risk", fixture().contentBrief.riskNotes.length >= 1);
  }],
  ["Content Brief has reviewable draft preview", () => {
    assert("preview", fixture().contentBrief.draftPreview.includes("実売上とは分離"));
  }],
  ["Campaign title is review candidate only", () => {
    assert("title", fixture().campaignCandidate.campaignTitle.includes("Mock Campaign案"));
  }],
  ["Production true rejected on campaign", () => {
    const c = { ...fixture().campaignCandidate, productionExecution: true };
    assert("prod", validateCampaignDraftCandidate(c).valid === false);
  }],
  ["External true rejected on brief", () => {
    const b = { ...fixture().contentBrief, externalExecution: true };
    assert("external", validateContentBriefCandidate(b).valid === false);
  }],
  ["Actual Revenue field rejected on campaign", () => {
    const c = { ...fixture().campaignCandidate, actualRevenue: 1 };
    assert("actual", validateCampaignDraftCandidate(c).valid === false);
  }],
  ["Approval true rejected on brief", () => {
    const b = { ...fixture().contentBrief, approvalConfirmed: true };
    assert("approval", validateContentBriefCandidate(b).valid === false);
  }],
  ["Input mutation does not occur", () => {
    const { handoff } = fixture();
    const before = JSON.stringify(handoff);
    createCampaignDraftCandidate(handoff, CREATED_AT);
    assert("mutation", JSON.stringify(handoff) === before);
  }],
  ["Storage keys are frozen", () => {
    assert("keys", CAMPAIGN_CANDIDATE_STORAGE_KEY === "kevirio:campaign-candidates:v2" && CONTENT_BRIEF_CANDIDATE_STORAGE_KEY === "kevirio:content-brief-candidates:v2");
  }],
  ["Service has no external communication", async () => {
    const source = await fs.readFile(new URL("../src/services/marketCampaignCandidateService.js", import.meta.url), "utf8");
    assert("no fetch", !source.includes("fetch("));
    assert("no axios", !source.includes("axios"));
    assert("no websocket", !source.includes("WebSocket"));
  }],
  ["Service does not import legacy engines", async () => {
    const source = await fs.readFile(new URL("../src/services/marketCampaignCandidateService.js", import.meta.url), "utf8");
    assert("no legacy", !source.includes("campaignEngine") && !source.includes("revenueCampaignService") && !source.includes("opportunityEngine"));
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

console.log(`\nMarket Campaign Candidate verification: ${passed}/${tests.length} passed`);
if (failures.length) process.exitCode = 1;
