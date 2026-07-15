import fs from "node:fs/promises";
import { mockMarketSignals } from "../src/data/mockMarketSignals.js";
import { buildMarketIntelligenceFoundation } from "../src/services/marketIntelligenceEngine.js";
import { buildMarketIntelligenceViewModel } from "../src/services/marketIntelligenceAdapter.js";
import { createMarketDecision } from "../src/services/marketDecisionService.js";
import { CAMPAIGN_HANDOFF_STORAGE_KEY } from "../src/services/campaignRecommendationHandoffService.js";
import { CAMPAIGN_CANDIDATE_STORAGE_KEY, CONTENT_BRIEF_CANDIDATE_STORAGE_KEY } from "../src/services/marketCampaignCandidateService.js";
import {
  OWNER_REVIEW_CANDIDATE_STORAGE_KEY,
  getOwnerReviewCandidateForDecision,
  loadOwnerReviewCandidates,
  saveRevenueDecisionVerticalSlice,
  validateOwnerReviewCandidate,
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

function fixture(decision = "approved") {
  const foundation = buildMarketIntelligenceFoundation(JSON.parse(JSON.stringify(mockMarketSignals)), Date.parse(EVALUATION_TIME));
  const recommendation = buildMarketIntelligenceViewModel(foundation, EVALUATION_TIME).recommendations[0];
  const ownerDecision = createMarketDecision({
    opportunityId: recommendation.opportunityId,
    opportunityVersion: recommendation.opportunityVersion,
    marketId: recommendation.marketId,
    correlationId: recommendation.correlationId,
    decision,
    reasonCode: decision === "approved" ? "OWNER_SELECTED_FOR_MOCK_CAMPAIGN" : "REVIEW_LATER",
    decidedAt: DECIDED_AT,
  }, DECIDED_AT);
  return { recommendation, ownerDecision };
}

function runSave(storage = new FakeStorage(), decision = "approved") {
  const { recommendation, ownerDecision } = fixture(decision);
  return saveRevenueDecisionVerticalSlice(storage, { recommendation, ownerDecision, createdAt: DECIDED_AT });
}

const tests = [
  ["Approved decision creates full vertical slice", () => {
    const result = runSave();
    assert("ok", result.ok === true && result.status === "reviewPending");
    assert("payload", result.payload.handoff && result.payload.campaignCandidate && result.payload.contentBrief && result.payload.reviewCandidate);
  }],
  ["HOLD does not create vertical slice", () => {
    const result = runSave(new FakeStorage(), "hold");
    assert("hold", result.ok === false && result.status === "owner_decision_not_approved");
  }],
  ["Review Candidate validates", () => {
    const result = runSave();
    assert("valid", validateOwnerReviewCandidate(result.payload.reviewCandidate).valid);
  }],
  ["Review Candidate is reviewPending only", () => {
    assert("status", runSave().payload.reviewCandidate.status === "reviewPending");
  }],
  ["Review Candidate keeps safety flags false", () => {
    const r = runSave().payload.reviewCandidate;
    assert("safe", r.productionExecution === false && r.externalExecution === false && r.publishEnabled === false && r.ledgerAppend === false && r.actualRevenueConnected === false && r.approvalConfirmed === false);
  }],
  ["One approved click writes four workspaces", () => {
    const storage = new FakeStorage();
    runSave(storage);
    assert("handoff", Boolean(storage.getItem(CAMPAIGN_HANDOFF_STORAGE_KEY)));
    assert("campaign", Boolean(storage.getItem(CAMPAIGN_CANDIDATE_STORAGE_KEY)));
    assert("brief", Boolean(storage.getItem(CONTENT_BRIEF_CANDIDATE_STORAGE_KEY)));
    assert("review", Boolean(storage.getItem(OWNER_REVIEW_CANDIDATE_STORAGE_KEY)));
  }],
  ["Duplicate approved click does not duplicate review candidate", () => {
    const storage = new FakeStorage();
    runSave(storage);
    runSave(storage);
    const loaded = loadOwnerReviewCandidates(storage);
    assert("one", Object.keys(loaded.workspace.reviewCandidatesById).length === 1);
  }],
  ["Reload restores review candidate", () => {
    const storage = new FakeStorage();
    const first = runSave(storage);
    const loaded = loadOwnerReviewCandidates(storage);
    const review = getOwnerReviewCandidateForDecision(loaded.workspace, first.payload.reviewCandidate.ownerDecisionId);
    assert("restored", review?.reviewCandidateId === first.payload.reviewCandidate.reviewCandidateId);
  }],
  ["Corrupted review workspace fails closed", () => {
    const storage = new FakeStorage({ [OWNER_REVIEW_CANDIDATE_STORAGE_KEY]: "{broken" });
    const result = runSave(storage);
    assert("corrupted", result.ok === false && result.status === "corrupted");
  }],
  ["Schema mismatch fails closed", () => {
    const storage = new FakeStorage({ [OWNER_REVIEW_CANDIDATE_STORAGE_KEY]: JSON.stringify({ schemaVersion: "1", dataMode: "mock", isMock: true, workspaceOnly: true, reviewCandidatesById: {} }) });
    const result = runSave(storage);
    assert("schema", result.ok === false && result.status === "corrupted");
  }],
  ["Write failure rolls back partial state", () => {
    const storage = new FakeStorage();
    storage.failOnKey = CONTENT_BRIEF_CANDIDATE_STORAGE_KEY;
    const result = runSave(storage);
    assert("failed", result.ok === false && result.status === "save_failed");
    assert("rollback handoff", storage.getItem(CAMPAIGN_HANDOFF_STORAGE_KEY) === null);
    assert("rollback campaign", storage.getItem(CAMPAIGN_CANDIDATE_STORAGE_KEY) === null);
  }],
  ["Actual Revenue field rejected on review", () => {
    const review = { ...runSave().payload.reviewCandidate, actualRevenueConnected: true };
    assert("actual", validateOwnerReviewCandidate(review).valid === false);
  }],
  ["Production true rejected on review", () => {
    const review = { ...runSave().payload.reviewCandidate, productionExecution: true };
    assert("prod", validateOwnerReviewCandidate(review).valid === false);
  }],
  ["External true rejected on review", () => {
    const review = { ...runSave().payload.reviewCandidate, externalExecution: true };
    assert("external", validateOwnerReviewCandidate(review).valid === false);
  }],
  ["Approval true rejected on review", () => {
    const review = { ...runSave().payload.reviewCandidate, approvalConfirmed: true };
    assert("approval", validateOwnerReviewCandidate(review).valid === false);
  }],
  ["Review candidate contains Content Brief preview", () => {
    const review = runSave().payload.reviewCandidate;
    assert("brief", review.contentBriefPreview.draftPreview.includes("実売上とは分離"));
  }],
  ["Review candidate contains Campaign summary", () => {
    const review = runSave().payload.reviewCandidate;
    assert("summary", Boolean(review.campaignSummary.offerConcept));
  }],
  ["Workspace limit blocks 51st insert", () => {
    const storage = new FakeStorage();
    runSave(storage);
    const workspace = JSON.parse(storage.getItem(OWNER_REVIEW_CANDIDATE_STORAGE_KEY));
    for (let index = 1; index < 50; index += 1) {
      workspace.reviewCandidatesById[`existing-${index}`] = { ...Object.values(workspace.reviewCandidatesById)[0], reviewCandidateId: `existing-${index}`, contentBriefId: `brief-${index}` };
    }
    storage.setItem(OWNER_REVIEW_CANDIDATE_STORAGE_KEY, JSON.stringify(workspace));
    const { recommendation, ownerDecision } = fixture("approved");
    const nextRecommendation = { ...recommendation, opportunityId: `${recommendation.opportunityId}:next`, opportunityVersion: "next" };
    const nextDecision = { ...ownerDecision, decisionId: `${ownerDecision.decisionId}:next`, opportunityId: nextRecommendation.opportunityId, opportunityVersion: "next" };
    const result = saveRevenueDecisionVerticalSlice(storage, { recommendation: nextRecommendation, ownerDecision: nextDecision, createdAt: DECIDED_AT });
    assert("limit", result.ok === false);
  }],
  ["Storage key is frozen", () => {
    assert("key", OWNER_REVIEW_CANDIDATE_STORAGE_KEY === "kevirio:owner-review-candidates:v2");
  }],
  ["Adapter source has no external communication", async () => {
    const source = await fs.readFile(new URL("../src/services/ownerReviewCandidateAdapter.js", import.meta.url), "utf8");
    assert("no fetch", !source.includes("fetch("));
    assert("no axios", !source.includes("axios"));
    assert("no websocket", !source.includes("WebSocket"));
  }],
  ["Adapter source does not import legacy engines", async () => {
    const source = await fs.readFile(new URL("../src/services/ownerReviewCandidateAdapter.js", import.meta.url), "utf8");
    assert("no legacy", !source.includes("campaignEngine") && !source.includes("revenueCampaignService") && !source.includes("opportunityEngine"));
  }],
  ["Adapter source does not append ledger", async () => {
    const source = await fs.readFile(new URL("../src/services/ownerReviewCandidateAdapter.js", import.meta.url), "utf8");
    assert("no append", !source.includes("appendLedger") && !source.includes("appendEvent"));
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

console.log(`\nOwner Review Candidate verification: ${passed}/${tests.length} passed`);
if (failures.length) process.exitCode = 1;
