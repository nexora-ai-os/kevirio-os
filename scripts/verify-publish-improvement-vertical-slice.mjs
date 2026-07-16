import fs from "node:fs/promises";
import { mockMarketSignals } from "../src/data/mockMarketSignals.js";
import { buildMarketIntelligenceFoundation } from "../src/services/marketIntelligenceEngine.js";
import { buildMarketIntelligenceViewModel } from "../src/services/marketIntelligenceAdapter.js";
import { createMarketDecision } from "../src/services/marketDecisionService.js";
import { saveRevenueDecisionVerticalSlice } from "../src/services/ownerReviewCandidateAdapter.js";
import {
  REVIEW_DECISION_STORAGE_KEY,
  REVIEW_REASON_OPTIONS,
  createReviewDecision,
  getReviewCandidateVersion,
  loadReviewDecisions,
  validateReviewDecision,
} from "../src/services/ownerReviewDecisionService.js";
import {
  REVISION_CANDIDATE_STORAGE_KEY,
  getLatestRevisionCandidate,
  loadRevisionCandidates,
  validateRevisionCandidate,
} from "../src/services/revisionCandidateService.js";
import {
  IMPROVEMENT_RECOMMENDATION_STORAGE_KEY,
  PUBLISH_READY_EXPORT_STORAGE_KEY,
  SANDBOX_PERFORMANCE_STORAGE_KEY,
  createImprovementRecommendations,
  createPublishReadyExport,
  createSandboxPerformance,
  loadPublishImprovementWorkspace,
  validateImprovementRecommendation,
  validatePublishReadyExport,
  validateSandboxPerformance,
} from "../src/services/publishImprovementService.js";
import {
  loadPublishImprovementState,
  runOwnerReviewWorkflow,
} from "../src/services/publishImprovementOrchestrator.js";

const EVALUATION_TIME = "2026-07-14T12:00:00.000Z";
const DECIDED_AT = "2026-07-16T00:00:00.000Z";

class FakeStorage {
  constructor(initial = {}) {
    this.store = { ...initial };
    this.failOnKey = null;
    this.writes = 0;
  }
  getItem(key) {
    return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
  }
  setItem(key, value) {
    if (this.failOnKey === key) throw new Error("write failed");
    this.writes += 1;
    this.store[key] = value;
  }
  removeItem(key) {
    delete this.store[key];
  }
}

function assert(name, condition, details = "") {
  if (!condition) throw new Error(`${name}${details ? `: ${details}` : ""}`);
}

function countItems(storage, storageKey, collection) {
  const raw = storage.getItem(storageKey);
  if (!raw) return 0;
  return Object.keys(JSON.parse(raw)[collection] || {}).length;
}

function fixture() {
  const storage = new FakeStorage();
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
  const saved = saveRevenueDecisionVerticalSlice(storage, { recommendation, ownerDecision, createdAt: DECIDED_AT });
  return { storage, reviewCandidate: saved.payload.reviewCandidate };
}

function approve(storage, reviewCandidate) {
  return runOwnerReviewWorkflow(storage, reviewCandidate, {
    decision: "approvedForMockWorkflow",
    reasonCode: "MOCK_WORKFLOW_READY",
    decidedAt: DECIDED_AT,
  });
}

function requestRevision(storage, reviewCandidate, reasonCode = "CLARIFY_OFFER") {
  const reason = REVIEW_REASON_OPTIONS.revisionRequested.find((option) => option.code === reasonCode);
  return runOwnerReviewWorkflow(storage, reviewCandidate, {
    decision: "revisionRequested",
    reasonCode,
    reasonText: reason?.label,
    decidedAt: DECIDED_AT,
  });
}

function reject(storage, reviewCandidate) {
  return runOwnerReviewWorkflow(storage, reviewCandidate, {
    decision: "rejected",
    reasonCode: "NOT_ALIGNED",
    decidedAt: DECIDED_AT,
  });
}

async function readSource(relativePath) {
  return fs.readFile(new URL(relativePath, import.meta.url), "utf8");
}

const tests = [
  ["Review Decision allows approvedForMockWorkflow", () => {
    const { reviewCandidate } = fixture();
    assert("valid", validateReviewDecision(createReviewDecision(reviewCandidate, { decision: "approvedForMockWorkflow", reasonCode: "MOCK_WORKFLOW_READY", decidedAt: DECIDED_AT })).valid);
  }],
  ["Review Decision allows revisionRequested", () => {
    const { reviewCandidate } = fixture();
    assert("valid", validateReviewDecision(createReviewDecision(reviewCandidate, { decision: "revisionRequested", reasonCode: "CLARIFY_OFFER", decidedAt: DECIDED_AT })).valid);
  }],
  ["Review Decision allows rejected", () => {
    const { reviewCandidate } = fixture();
    assert("valid", validateReviewDecision(createReviewDecision(reviewCandidate, { decision: "rejected", reasonCode: "NOT_ALIGNED", decidedAt: DECIDED_AT })).valid);
  }],
  ["Review Decision rejects unknown state", () => {
    const { reviewCandidate } = fixture();
    assert("invalid", !validateReviewDecision(createReviewDecision(reviewCandidate, { decision: "published", decidedAt: DECIDED_AT })).valid);
  }],
  ["Review Decision ID is deterministic", () => {
    const { reviewCandidate } = fixture();
    const first = createReviewDecision(reviewCandidate, { decision: "approvedForMockWorkflow", reasonCode: "MOCK_WORKFLOW_READY", decidedAt: DECIDED_AT });
    const second = createReviewDecision(reviewCandidate, { decision: "rejected", reasonCode: "NOT_ALIGNED", decidedAt: DECIDED_AT });
    assert("same id", first.reviewDecisionId === second.reviewDecisionId);
  }],
  ["Review Decision replaces latest state", () => {
    const { storage, reviewCandidate } = fixture();
    requestRevision(storage, reviewCandidate);
    approve(storage, reviewCandidate);
    const loaded = loadReviewDecisions(storage);
    const items = Object.values(loaded.workspace.reviewDecisionsByCandidateVersion);
    assert("one", items.length === 1);
    assert("approved", items[0].decision === "approvedForMockWorkflow");
  }],
  ["Review Decision forbids Production", () => {
    const { reviewCandidate } = fixture();
    const decision = { ...createReviewDecision(reviewCandidate, { decision: "approvedForMockWorkflow", reasonCode: "MOCK_WORKFLOW_READY", decidedAt: DECIDED_AT }), productionExecution: true };
    assert("invalid", !validateReviewDecision(decision).valid);
  }],
  ["Review Decision forbids external", () => {
    const { reviewCandidate } = fixture();
    const decision = { ...createReviewDecision(reviewCandidate, { decision: "approvedForMockWorkflow", reasonCode: "MOCK_WORKFLOW_READY", decidedAt: DECIDED_AT }), externalExecution: true };
    assert("invalid", !validateReviewDecision(decision).valid);
  }],
  ["Review Decision forbids approval confirmation", () => {
    const { reviewCandidate } = fixture();
    const decision = { ...createReviewDecision(reviewCandidate, { decision: "approvedForMockWorkflow", reasonCode: "MOCK_WORKFLOW_READY", decidedAt: DECIDED_AT }), approvalConfirmed: true };
    assert("invalid", !validateReviewDecision(decision).valid);
  }],
  ["Corrupted Decision storage fails closed", () => {
    const { storage, reviewCandidate } = fixture();
    storage.setItem(REVIEW_DECISION_STORAGE_KEY, "{broken");
    assert("corrupted", !approve(storage, reviewCandidate).ok);
  }],
  ["Schema mismatch Decision storage fails closed", () => {
    const { storage, reviewCandidate } = fixture();
    storage.setItem(REVIEW_DECISION_STORAGE_KEY, JSON.stringify({ schemaVersion: "1", dataMode: "mock", isMock: true, workspaceOnly: true, reviewDecisionsByCandidateVersion: {} }));
    assert("corrupted", !approve(storage, reviewCandidate).ok);
  }],
  ["Revision only generates from revisionRequested", () => {
    const { storage, reviewCandidate } = fixture();
    assert("revision", requestRevision(storage, reviewCandidate).payload.revisionCandidate);
    assert("approved no revision", !approve(new FakeStorage(), reviewCandidate).payload.revisionCandidate);
  }],
  ["Rejected does not generate Revision", () => {
    const { storage, reviewCandidate } = fixture();
    assert("rejected", reject(storage, reviewCandidate).ok);
    assert("none", countItems(storage, REVISION_CANDIDATE_STORAGE_KEY, "revisionCandidatesById") === 0);
  }],
  ["Revision number starts at 1", () => {
    const { storage, reviewCandidate } = fixture();
    assert("one", requestRevision(storage, reviewCandidate).payload.revisionCandidate.revisionNumber === 1);
  }],
  ["Duplicate revision request is idempotent", () => {
    const { storage, reviewCandidate } = fixture();
    requestRevision(storage, reviewCandidate);
    requestRevision(storage, reviewCandidate);
    assert("one", countItems(storage, REVISION_CANDIDATE_STORAGE_KEY, "revisionCandidatesById") === 1);
  }],
  ["Different revision reasons create next revision", () => {
    const { storage, reviewCandidate } = fixture();
    requestRevision(storage, reviewCandidate, "CLARIFY_OFFER");
    requestRevision(storage, reviewCandidate, "TONE_DOWN_CLAIMS");
    assert("two", countItems(storage, REVISION_CANDIDATE_STORAGE_KEY, "revisionCandidatesById") === 2);
  }],
  ["Revision max is three", () => {
    const { storage, reviewCandidate } = fixture();
    requestRevision(storage, reviewCandidate, "CLARIFY_OFFER");
    requestRevision(storage, reviewCandidate, "TONE_DOWN_CLAIMS");
    requestRevision(storage, reviewCandidate, "SHARPEN_TARGET");
    const result = requestRevision(storage, reviewCandidate, "NOT_A_REASON");
    assert("blocked", !result.ok);
  }],
  ["Latest Revision is available", () => {
    const { storage, reviewCandidate } = fixture();
    requestRevision(storage, reviewCandidate, "CLARIFY_OFFER");
    requestRevision(storage, reviewCandidate, "TONE_DOWN_CLAIMS");
    const latest = getLatestRevisionCandidate(loadRevisionCandidates(storage).workspace, reviewCandidate.reviewCandidateId);
    assert("latest", latest.revisionNumber === 2);
  }],
  ["Revision validates safety", () => {
    const { storage, reviewCandidate } = fixture();
    const revision = requestRevision(storage, reviewCandidate).payload.revisionCandidate;
    assert("valid", validateRevisionCandidate(revision).valid);
    assert("safe", revision.productionExecution === false && revision.externalExecution === false && revision.approvalConfirmed === false);
  }],
  ["Revision keeps source Candidate unchanged", () => {
    const { storage, reviewCandidate } = fixture();
    const before = JSON.stringify(reviewCandidate);
    requestRevision(storage, reviewCandidate);
    assert("unchanged", JSON.stringify(reviewCandidate) === before);
  }],
  ["Revision keeps correlationId", () => {
    const { storage, reviewCandidate } = fixture();
    assert("correlation", requestRevision(storage, reviewCandidate).payload.revisionCandidate.correlationId === reviewCandidate.correlationId);
  }],
  ["Revision does not include score recalculation fields", () => {
    const { storage, reviewCandidate } = fixture();
    const text = JSON.stringify(requestRevision(storage, reviewCandidate).payload.revisionCandidate);
    assert("no scoring", !text.includes("finalScore") && !text.includes("ranking") && !text.includes("adjustedConfidence"));
  }],
  ["Approve creates Export", () => {
    const { storage, reviewCandidate } = fixture();
    const result = approve(storage, reviewCandidate);
    assert("export", result.payload.exportEntity.status === "publishReadyMock");
  }],
  ["Export validates safety", () => {
    const { storage, reviewCandidate } = fixture();
    const exportEntity = approve(storage, reviewCandidate).payload.exportEntity;
    assert("valid", validatePublishReadyExport(exportEntity).valid);
    assert("safe", exportEntity.publishEnabled === false && exportEntity.externalExecution === false && exportEntity.productionExecution === false);
  }],
  ["Export requires approvedForMockWorkflow", () => {
    const { reviewCandidate } = fixture();
    const decision = createReviewDecision(reviewCandidate, { decision: "rejected", reasonCode: "NOT_ALIGNED", decidedAt: DECIDED_AT });
    assert("blocked", !createPublishReadyExport(reviewCandidate, decision).ok);
  }],
  ["Export uses latest Revision when present", () => {
    const { storage, reviewCandidate } = fixture();
    requestRevision(storage, reviewCandidate, "CLARIFY_OFFER");
    const result = approve(storage, reviewCandidate);
    assert("revision source", Boolean(result.payload.exportEntity.sourceRevisionCandidateId));
  }],
  ["Export includes Markdown", () => {
    const { storage, reviewCandidate } = fixture();
    const markdown = approve(storage, reviewCandidate).payload.exportEntity.markdown;
    assert("markdown", markdown.startsWith("# ") && markdown.includes("Production公開なし"));
  }],
  ["Export preserves forbidden claims", () => {
    const { storage, reviewCandidate } = fixture();
    const exportEntity = approve(storage, reviewCandidate).payload.exportEntity;
    assert("claims", Array.isArray(exportEntity.prohibitedClaims));
  }],
  ["Sandbox requires Export", () => {
    assert("blocked", !createSandboxPerformance(null).ok);
  }],
  ["Sandbox is deterministic", () => {
    const { storage, reviewCandidate } = fixture();
    const exportEntity = approve(storage, reviewCandidate).payload.exportEntity;
    assert("same", JSON.stringify(createSandboxPerformance(exportEntity).performance) === JSON.stringify(createSandboxPerformance(exportEntity).performance));
  }],
  ["Sandbox validates metric ranges", () => {
    const { storage, reviewCandidate } = fixture();
    const performance = approve(storage, reviewCandidate).payload.sandboxPerformance;
    assert("valid", validateSandboxPerformance(performance).valid);
    assert("ranges", performance.mockCtr >= 0 && performance.mockCtr <= 1 && performance.mockConversionRate >= 0 && performance.mockConversionRate <= 1);
  }],
  ["Sandbox uses mock estimate only", () => {
    const { storage, reviewCandidate } = fixture();
    const performance = approve(storage, reviewCandidate).payload.sandboxPerformance;
    assert("mock estimate", performance.mockRevenueEstimate.isMock === true && !Object.hasOwn(performance, "revenue"));
  }],
  ["Sandbox does not use actual revenue field", () => {
    const { storage, reviewCandidate } = fixture();
    const text = JSON.stringify(approve(storage, reviewCandidate).payload.sandboxPerformance);
    assert("no actual entity field", !text.includes("\"actualRevenue\":"));
  }],
  ["Sandbox separates Forecast from Mock", () => {
    const { storage, reviewCandidate } = fixture();
    const performance = approve(storage, reviewCandidate).payload.sandboxPerformance;
    assert("separate", Object.hasOwn(performance, "forecastRevenueRange") && Object.hasOwn(performance, "mockRevenueEstimate"));
  }],
  ["Improvement requires Performance", () => {
    assert("blocked", !createImprovementRecommendations(null).ok);
  }],
  ["Improvement returns max three", () => {
    const { storage, reviewCandidate } = fixture();
    const improvements = approve(storage, reviewCandidate).payload.improvementRecommendations;
    assert("max three", improvements.length <= 3);
  }],
  ["Improvement priority is deterministic", () => {
    const { storage, reviewCandidate } = fixture();
    const performance = approve(storage, reviewCandidate).payload.sandboxPerformance;
    assert("same", JSON.stringify(createImprovementRecommendations(performance).improvements) === JSON.stringify(createImprovementRecommendations(performance).improvements));
  }],
  ["Improvement validates safety", () => {
    const { storage, reviewCandidate } = fixture();
    const improvement = approve(storage, reviewCandidate).payload.improvementRecommendations[0];
    assert("valid", validateImprovementRecommendation(improvement).valid);
    assert("manual", improvement.autoApplyEnabled === false && improvement.productionExecution === false);
  }],
  ["Improvement has nextAction", () => {
    const { storage, reviewCandidate } = fixture();
    assert("next", Boolean(approve(storage, reviewCandidate).payload.improvementRecommendations[0].nextAction));
  }],
  ["Approve transaction creates one Export, Performance, and three Improvements", () => {
    const { storage, reviewCandidate } = fixture();
    approve(storage, reviewCandidate);
    assert("export one", countItems(storage, PUBLISH_READY_EXPORT_STORAGE_KEY, "publishReadyExportsById") === 1);
    assert("performance one", countItems(storage, SANDBOX_PERFORMANCE_STORAGE_KEY, "sandboxPerformanceById") === 1);
    assert("improvements three", countItems(storage, IMPROVEMENT_RECOMMENDATION_STORAGE_KEY, "improvementRecommendationsById") === 3);
  }],
  ["Duplicate approve keeps one downstream set", () => {
    const { storage, reviewCandidate } = fixture();
    approve(storage, reviewCandidate);
    approve(storage, reviewCandidate);
    assert("export one", countItems(storage, PUBLISH_READY_EXPORT_STORAGE_KEY, "publishReadyExportsById") === 1);
    assert("performance one", countItems(storage, SANDBOX_PERFORMANCE_STORAGE_KEY, "sandboxPerformanceById") === 1);
    assert("improvements three", countItems(storage, IMPROVEMENT_RECOMMENDATION_STORAGE_KEY, "improvementRecommendationsById") === 3);
  }],
  ["Reload restores downstream state", () => {
    const { storage, reviewCandidate } = fixture();
    approve(storage, reviewCandidate);
    const state = loadPublishImprovementState(storage, reviewCandidate);
    assert("loaded", state.payload.exportEntity && state.payload.sandboxPerformance && state.payload.improvementRecommendations.length === 3);
  }],
  ["Revision request creates one Revision only", () => {
    const { storage, reviewCandidate } = fixture();
    requestRevision(storage, reviewCandidate);
    assert("decision", countItems(storage, REVIEW_DECISION_STORAGE_KEY, "reviewDecisionsByCandidateVersion") === 1);
    assert("revision", countItems(storage, REVISION_CANDIDATE_STORAGE_KEY, "revisionCandidatesById") === 1);
    assert("no export", countItems(storage, PUBLISH_READY_EXPORT_STORAGE_KEY, "publishReadyExportsById") === 0);
  }],
  ["Revision then approve exports latest Revision", () => {
    const { storage, reviewCandidate } = fixture();
    const revision = requestRevision(storage, reviewCandidate).payload.revisionCandidate;
    const approved = approve(storage, reviewCandidate);
    assert("latest", approved.payload.exportEntity.sourceRevisionCandidateId === revision.revisionCandidateId);
  }],
  ["Rejected hides old downstream state", () => {
    const { storage, reviewCandidate } = fixture();
    approve(storage, reviewCandidate);
    reject(storage, reviewCandidate);
    const state = loadPublishImprovementState(storage, reviewCandidate);
    assert("hidden", !state.payload.exportEntity && state.payload.decision.decision === "rejected");
  }],
  ["Write failure rolls back approve transaction", () => {
    const { storage, reviewCandidate } = fixture();
    storage.failOnKey = SANDBOX_PERFORMANCE_STORAGE_KEY;
    const result = approve(storage, reviewCandidate);
    assert("failed", !result.ok);
    assert("rollback decision", countItems(storage, REVIEW_DECISION_STORAGE_KEY, "reviewDecisionsByCandidateVersion") === 0);
    assert("rollback export", countItems(storage, PUBLISH_READY_EXPORT_STORAGE_KEY, "publishReadyExportsById") === 0);
  }],
  ["Corrupted Revision storage stops generation", () => {
    const { storage, reviewCandidate } = fixture();
    storage.setItem(REVISION_CANDIDATE_STORAGE_KEY, "{broken");
    assert("blocked", !requestRevision(storage, reviewCandidate).ok);
  }],
  ["Publish workspaces fail closed on schema mismatch", () => {
    const { storage, reviewCandidate } = fixture();
    storage.setItem(PUBLISH_READY_EXPORT_STORAGE_KEY, JSON.stringify({ schemaVersion: "1", dataMode: "mock", isMock: true, workspaceOnly: true, publishReadyExportsById: {} }));
    assert("blocked", !approve(storage, reviewCandidate).ok);
  }],
  ["Workspace keys are frozen", () => {
    assert("keys", REVIEW_DECISION_STORAGE_KEY === "kevirio:review-decisions:v2" && PUBLISH_READY_EXPORT_STORAGE_KEY === "kevirio:publish-ready-exports:v2");
  }],
  ["Services do not import UI", async () => {
    const source = await readSource("../src/services/publishImprovementOrchestrator.js");
    assert("no ui", !source.includes("components/") && !source.includes(".jsx"));
  }],
  ["Services do not call external communication APIs", async () => {
    const source = [
      await readSource("../src/services/ownerReviewDecisionService.js"),
      await readSource("../src/services/revisionCandidateService.js"),
      await readSource("../src/services/publishImprovementService.js"),
      await readSource("../src/services/publishImprovementOrchestrator.js"),
    ].join("\n");
    assert("no external", !source.includes("fetch" + "(") && !source.includes("axios") && !source.includes("WebSocket") && !source.includes("EventSource") && !source.includes("sendBeacon"));
  }],
  ["Services do not append ledger", async () => {
    const source = await readSource("../src/services/publishImprovementOrchestrator.js");
    assert("no append", !source.includes("appendLedger") && !source.includes("appendEvent"));
  }],
  ["UI shows three Owner operations", async () => {
    const source = await readSource("../src/components/OwnerReviewWorkspace.jsx");
    assert("buttons", source.includes("承認") && source.includes("修正依頼") && source.includes("却下"));
  }],
  ["UI avoids raw approved state wording", async () => {
    const source = await readSource("../src/components/OwnerReviewWorkspace.jsx");
    assert("safe label", source.includes("Mock公開準備へ承認済み"));
  }],
  ["UI shows Sandbox not actual", async () => {
    const source = await readSource("../src/components/OwnerReviewWorkspace.jsx");
    assert("sandbox", source.includes("Sandbox模擬結果") && source.includes("実績ではありません"));
  }],
  ["UI has accessibility attributes", async () => {
    const source = await readSource("../src/components/OwnerReviewWorkspace.jsx");
    assert("a11y", source.includes("aria-pressed") && source.includes("aria-expanded") && source.includes("role=\"alert\""));
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

console.log(`\nPublish & Improvement Vertical Slice verification: ${passed}/${tests.length} passed`);
if (failures.length) process.exitCode = 1;
