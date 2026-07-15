import fs from "node:fs/promises";
import { mockMarketSignals } from "../src/data/mockMarketSignals.js";
import { buildMarketIntelligenceFoundation } from "../src/services/marketIntelligenceEngine.js";
import { buildMarketIntelligenceViewModel } from "../src/services/marketIntelligenceAdapter.js";
import { saveMarketDecision } from "../src/services/marketDecisionService.js";
import {
  OWNER_REVIEW_CANDIDATE_STORAGE_KEY,
  buildOwnerReviewQueueViewModel,
  loadOwnerReviewCandidates,
  markOwnerReviewCandidateSuperseded,
  saveRevenueDecisionVerticalSlice,
} from "../src/services/ownerReviewCandidateAdapter.js";

const EVALUATION_TIME = "2026-07-14T12:00:00.000Z";
const DECIDED_AT = "2026-07-15T00:00:00.000Z";

class FakeStorage {
  constructor(initial = {}) {
    this.store = { ...initial };
    this.failOnKey = null;
  }
  getItem(key) {
    return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
  }
  setItem(key, value) {
    if (this.failOnKey === key) throw new Error("write failed");
    this.store[key] = value;
  }
  removeItem(key) {
    delete this.store[key];
  }
}

function assert(name, condition, details = "") {
  if (!condition) throw new Error(`${name}${details ? `: ${details}` : ""}`);
}

function recommendationFixture() {
  const foundation = buildMarketIntelligenceFoundation(JSON.parse(JSON.stringify(mockMarketSignals)), Date.parse(EVALUATION_TIME));
  return buildMarketIntelligenceViewModel(foundation, EVALUATION_TIME).recommendations[0];
}

function approveFlow(storage = new FakeStorage()) {
  const recommendation = recommendationFixture();
  const decisionResult = saveMarketDecision(storage, {
    opportunityId: recommendation.opportunityId,
    opportunityVersion: recommendation.opportunityVersion,
    marketId: recommendation.marketId,
    correlationId: recommendation.correlationId,
    decision: "approved",
    reasonCode: "OWNER_SELECTED_FOR_MOCK_CAMPAIGN",
    decidedAt: DECIDED_AT,
  });
  const verticalResult = saveRevenueDecisionVerticalSlice(storage, {
    recommendation,
    ownerDecision: decisionResult.decision,
    createdAt: DECIDED_AT,
  });
  return { storage, recommendation, decisionResult, verticalResult };
}

function reviewViewModel(storage) {
  return buildOwnerReviewQueueViewModel(loadOwnerReviewCandidates(storage));
}

const tests = [
  ["Top3 first recommendation can be approved", () => {
    const flow = approveFlow();
    assert("decision", flow.decisionResult.ok === true);
    assert("vertical", flow.verticalResult.ok === true);
  }],
  ["Decision is saved once", () => {
    const { decisionResult } = approveFlow();
    assert("decision saved", decisionResult.saved === true);
  }],
  ["Handoff is saved once", () => {
    const { verticalResult } = approveFlow();
    assert("handoff", Boolean(verticalResult.payload.handoff.handoffId));
  }],
  ["Campaign Candidate is saved once", () => {
    const { verticalResult } = approveFlow();
    assert("campaign", Boolean(verticalResult.payload.campaignCandidate.campaignCandidateId));
  }],
  ["Content Brief is saved once", () => {
    const { verticalResult } = approveFlow();
    assert("brief", Boolean(verticalResult.payload.contentBrief.contentBriefId));
  }],
  ["Review Candidate is saved once", () => {
    const { verticalResult } = approveFlow();
    assert("review", Boolean(verticalResult.payload.reviewCandidate.reviewCandidateId));
  }],
  ["Owner Review ViewModel can be built", () => {
    const { storage } = approveFlow();
    assert("view", reviewViewModel(storage).ok === true);
  }],
  ["Campaign title is readable in review UI data", () => {
    const { storage } = approveFlow();
    assert("title", Boolean(reviewViewModel(storage).items[0].campaignTitle));
  }],
  ["Content Brief is readable in review UI data", () => {
    const { storage } = approveFlow();
    assert("brief", Boolean(reviewViewModel(storage).items[0].contentBrief));
  }],
  ["Draft Preview is readable in review UI data", () => {
    const { storage } = approveFlow();
    assert("preview", reviewViewModel(storage).items[0].draftPreview.includes("実売上とは分離"));
  }],
  ["Risk Notes are readable in review UI data", () => {
    const { storage } = approveFlow();
    assert("risk", reviewViewModel(storage).items[0].riskNotes.length >= 1);
  }],
  ["Mock boundary is visible in review UI data", () => {
    const { storage } = approveFlow();
    assert("mock", reviewViewModel(storage).items[0].mockLabel.includes("Mock"));
  }],
  ["Production/external/revenue safety is visible in review UI data", () => {
    const { storage } = approveFlow();
    assert("safety", reviewViewModel(storage).items[0].safetyLabel.includes("公開") && reviewViewModel(storage).items[0].safetyLabel.includes("実売上"));
  }],
  ["Duplicate approved operation stays one review item", () => {
    const storage = new FakeStorage();
    approveFlow(storage);
    approveFlow(storage);
    assert("one", reviewViewModel(storage).items.length === 1);
  }],
  ["Reload returns same review item", () => {
    const { storage } = approveFlow();
    const first = reviewViewModel(storage).items[0].reviewCandidateId;
    const second = buildOwnerReviewQueueViewModel(loadOwnerReviewCandidates(storage)).items[0].reviewCandidateId;
    assert("same", first === second);
  }],
  ["HOLD does not create downstream candidates", () => {
    const storage = new FakeStorage();
    const recommendation = recommendationFixture();
    const decisionResult = saveMarketDecision(storage, {
      opportunityId: recommendation.opportunityId,
      opportunityVersion: recommendation.opportunityVersion,
      marketId: recommendation.marketId,
      correlationId: recommendation.correlationId,
      decision: "hold",
      reasonCode: "REVIEW_LATER",
      decidedAt: DECIDED_AT,
    });
    const verticalResult = saveRevenueDecisionVerticalSlice(storage, { recommendation, ownerDecision: decisionResult.decision, createdAt: DECIDED_AT });
    assert("blocked", verticalResult.ok === false);
    assert("none", reviewViewModel(storage).items.length === 0);
  }],
  ["REJECT does not create downstream candidates", () => {
    const storage = new FakeStorage();
    const recommendation = recommendationFixture();
    const decisionResult = saveMarketDecision(storage, {
      opportunityId: recommendation.opportunityId,
      opportunityVersion: recommendation.opportunityVersion,
      marketId: recommendation.marketId,
      correlationId: recommendation.correlationId,
      decision: "rejected",
      reasonCode: "NOT_STRATEGIC_FIT",
      decidedAt: DECIDED_AT,
    });
    const verticalResult = saveRevenueDecisionVerticalSlice(storage, { recommendation, ownerDecision: decisionResult.decision, createdAt: DECIDED_AT });
    assert("blocked", verticalResult.ok === false);
    assert("none", reviewViewModel(storage).items.length === 0);
  }],
  ["APPROVE then HOLD marks review candidate superseded", () => {
    const { storage, decisionResult } = approveFlow();
    markOwnerReviewCandidateSuperseded(storage, decisionResult.decision.decisionId, DECIDED_AT, "owner_decision_changed");
    assert("hidden", reviewViewModel(storage).items.length === 0);
  }],
  ["Corrupted review storage fails closed", () => {
    const storage = new FakeStorage({ [OWNER_REVIEW_CANDIDATE_STORAGE_KEY]: "{broken" });
    const vm = reviewViewModel(storage);
    assert("corrupted", vm.ok === false && vm.items.length === 0);
  }],
  ["Write failure is not presented as success", () => {
    const storage = new FakeStorage();
    storage.failOnKey = OWNER_REVIEW_CANDIDATE_STORAGE_KEY;
    const flow = approveFlow(storage);
    assert("failed", flow.verticalResult.ok === false);
    assert("no success item", reviewViewModel(storage).items.length === 0);
  }],
  ["No Actual Revenue value in vertical payload", () => {
    const text = JSON.stringify(approveFlow().verticalResult.payload);
    assert("actual value", !text.includes("actualRevenue\":") && !text.includes("confirmedRevenue") && !text.includes("realizedRevenue"));
    assert("actual boundary", text.includes("actualRevenueConnected\":false"));
  }],
  ["No Production/external/publish enabled in vertical payload", () => {
    const text = JSON.stringify(approveFlow().verticalResult.payload);
    assert("prod", !text.includes("productionExecution\":true"));
    assert("external", !text.includes("externalExecution\":true"));
    assert("publish", !text.includes("publishEnabled\":true"));
  }],
  ["No score or ranking recalculation output", () => {
    const text = JSON.stringify(approveFlow().verticalResult.payload);
    assert("score", !text.includes("finalScore") && !text.includes("baseScore") && !text.includes("rank"));
  }],
  ["Input mutation does not occur", () => {
    const storage = new FakeStorage();
    const recommendation = recommendationFixture();
    const before = JSON.stringify(recommendation);
    const decisionResult = saveMarketDecision(storage, {
      opportunityId: recommendation.opportunityId,
      opportunityVersion: recommendation.opportunityVersion,
      marketId: recommendation.marketId,
      correlationId: recommendation.correlationId,
      decision: "approved",
      reasonCode: "OWNER_SELECTED_FOR_MOCK_CAMPAIGN",
      decidedAt: DECIDED_AT,
    });
    saveRevenueDecisionVerticalSlice(storage, { recommendation, ownerDecision: decisionResult.decision, createdAt: DECIDED_AT });
    assert("mutation", JSON.stringify(recommendation) === before);
  }],
  ["Correlation ID is preserved to review candidate", () => {
    const { recommendation, verticalResult } = approveFlow();
    assert("corr", verticalResult.payload.reviewCandidate.correlationId === recommendation.correlationId);
  }],
  ["UI source reads Owner Review Candidate workspace", async () => {
    const source = await fs.readFile(new URL("../src/components/OwnerReviewWorkspace.jsx", import.meta.url), "utf8");
    assert("consumer", source.includes("loadOwnerReviewCandidates") && source.includes("buildOwnerReviewQueueViewModel"));
  }],
  ["UI source displays required review fields", async () => {
    const source = await fs.readFile(new URL("../src/components/OwnerReviewWorkspace.jsx", import.meta.url), "utf8");
    assert("fields", source.includes("Campaign") && source.includes("Content Brief") && source.includes("Draft Preview") && source.includes("Risk Notes"));
  }],
  ["UI source avoids internal stack traces", async () => {
    const source = await fs.readFile(new URL("../src/components/OwnerReviewWorkspace.jsx", import.meta.url), "utf8");
    assert("no stack", !source.includes("error.stack"));
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

console.log(`\nRevenue Decision Vertical Slice verification: ${passed}/${tests.length} passed`);
if (failures.length) process.exitCode = 1;
