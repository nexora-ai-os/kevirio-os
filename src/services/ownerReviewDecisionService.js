import { DATA_MODES, MARKET_INTELLIGENCE_SCHEMA_VERSION } from "../data/marketIntelligenceSchemas.js";
import { createDeterministicId } from "./marketIntelligenceEngine.js";

export const REVIEW_DECISION_STORAGE_KEY = "kevirio:review-decisions:v2";
export const REVIEW_DECISIONS_COLLECTION = "reviewDecisionsByCandidateVersion";

const MAX_WORKSPACE_ITEMS = 50;
const ALLOWED_DECISIONS = Object.freeze(["approvedForMockWorkflow", "revisionRequested", "rejected"]);
export const REVIEW_REASON_OPTIONS = Object.freeze({
  approvedForMockWorkflow: [
    { code: "MOCK_WORKFLOW_READY", label: "Mock公開準備へ進める" },
  ],
  revisionRequested: [
    { code: "CLARIFY_OFFER", label: "提案をわかりやすくする" },
    { code: "TONE_DOWN_CLAIMS", label: "表現を安全に弱める" },
    { code: "SHARPEN_TARGET", label: "対象者を絞る" },
  ],
  rejected: [
    { code: "NOT_ALIGNED", label: "今回は進めない" },
    { code: "RISK_TOO_HIGH", label: "リスクが高い" },
  ],
});

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function emptyWorkspace() {
  return {
    schemaVersion: MARKET_INTELLIGENCE_SCHEMA_VERSION,
    dataMode: DATA_MODES.MOCK,
    isMock: true,
    workspaceOnly: true,
    [REVIEW_DECISIONS_COLLECTION]: {},
  };
}

export function getReviewCandidateVersion(reviewCandidate) {
  return reviewCandidate?.reviewCandidateVersion || reviewCandidate?.contentBriefId || "v1";
}

export function getReviewDecisionStorageKey(reviewCandidateId, reviewCandidateVersion) {
  return `${reviewCandidateId || "unknown"}::${reviewCandidateVersion || "v1"}`;
}

function getReviewDecisionId(reviewCandidateId, reviewCandidateVersion) {
  return createDeterministicId("owner-review-decision", {
    reviewCandidateId,
    reviewCandidateVersion,
    dataMode: DATA_MODES.MOCK,
  }).id;
}

function getReason(decision, reasonCode) {
  const options = REVIEW_REASON_OPTIONS[decision] || [];
  return options.find((option) => option.code === reasonCode) || options[0] || { code: "OWNER_DECISION", label: "Owner判断" };
}

export function createReviewDecision(reviewCandidate, input = {}) {
  const decision = input.decision;
  const reviewCandidateVersion = input.reviewCandidateVersion || getReviewCandidateVersion(reviewCandidate);
  const reason = getReason(decision, input.reasonCode);
  const decidedAt = input.decidedAt || "2026-07-16T00:00:00.000Z";
  return {
    reviewDecisionId: getReviewDecisionId(reviewCandidate?.reviewCandidateId, reviewCandidateVersion),
    reviewCandidateId: reviewCandidate?.reviewCandidateId,
    reviewCandidateVersion,
    correlationId: reviewCandidate?.correlationId,
    schemaVersion: MARKET_INTELLIGENCE_SCHEMA_VERSION,
    dataMode: DATA_MODES.MOCK,
    isMock: true,
    decision,
    reasonCode: reason.code,
    reasonText: input.reasonText || reason.label,
    decidedAt,
    productionExecution: false,
    externalExecution: false,
    approvalConfirmed: false,
    publishEnabled: false,
    ledgerAppend: false,
    actualRevenueConnected: false,
  };
}

export function validateReviewDecision(decision) {
  const errors = [];
  if (!isPlainObject(decision)) {
    return { valid: false, errors: [{ code: "DECISION_INVALID", field: "decision", message: "Review Decision must be an object." }] };
  }
  for (const field of ["reviewDecisionId", "reviewCandidateId", "reviewCandidateVersion", "correlationId", "schemaVersion", "dataMode", "isMock", "decision", "reasonCode", "reasonText", "decidedAt"]) {
    if (decision[field] === undefined || decision[field] === null || decision[field] === "") {
      errors.push({ code: "REQUIRED_FIELD_MISSING", field, message: `${field} is required.` });
    }
  }
  if (!ALLOWED_DECISIONS.includes(decision.decision)) errors.push({ code: "DECISION_NOT_ALLOWED", field: "decision", message: "Decision is not allowed." });
  if (decision.schemaVersion !== MARKET_INTELLIGENCE_SCHEMA_VERSION) errors.push({ code: "SCHEMA_VERSION_MISMATCH", field: "schemaVersion", message: "schemaVersion mismatch." });
  if (decision.dataMode !== DATA_MODES.MOCK) errors.push({ code: "REAL_DATA_NOT_ALLOWED", field: "dataMode", message: "Only mock is allowed." });
  if (decision.isMock !== true) errors.push({ code: "MOCK_REQUIRED", field: "isMock", message: "isMock must be true." });
  if (decision.productionExecution !== false) errors.push({ code: "PRODUCTION_FORBIDDEN", field: "productionExecution", message: "productionExecution must be false." });
  if (decision.externalExecution !== false) errors.push({ code: "EXTERNAL_FORBIDDEN", field: "externalExecution", message: "externalExecution must be false." });
  if (decision.approvalConfirmed !== false) errors.push({ code: "APPROVAL_FORBIDDEN", field: "approvalConfirmed", message: "approvalConfirmed must be false." });
  if (decision.publishEnabled !== false) errors.push({ code: "PUBLISH_FORBIDDEN", field: "publishEnabled", message: "publishEnabled must be false." });
  if (decision.ledgerAppend !== false) errors.push({ code: "LEDGER_FORBIDDEN", field: "ledgerAppend", message: "ledgerAppend must be false." });
  if (decision.actualRevenueConnected !== false) errors.push({ code: "ACTUAL_REVENUE_FORBIDDEN", field: "actualRevenueConnected", message: "actualRevenueConnected must be false." });
  if (decision.reviewDecisionId !== getReviewDecisionId(decision.reviewCandidateId, decision.reviewCandidateVersion)) {
    errors.push({ code: "DECISION_ID_MISMATCH", field: "reviewDecisionId", message: "reviewDecisionId must be deterministic." });
  }
  return { valid: errors.length === 0, errors };
}

export function validateReviewDecisionWorkspace(workspace) {
  const errors = [];
  if (!isPlainObject(workspace)) return [{ code: "WORKSPACE_INVALID", field: REVIEW_DECISION_STORAGE_KEY, message: "Workspace must be an object." }];
  if (workspace.schemaVersion !== MARKET_INTELLIGENCE_SCHEMA_VERSION) errors.push({ code: "SCHEMA_VERSION_MISMATCH", field: "schemaVersion", message: "schemaVersion mismatch." });
  if (workspace.dataMode !== DATA_MODES.MOCK) errors.push({ code: "REAL_DATA_NOT_ALLOWED", field: "dataMode", message: "Only mock is allowed." });
  if (workspace.isMock !== true) errors.push({ code: "MOCK_REQUIRED", field: "isMock", message: "isMock must be true." });
  if (workspace.workspaceOnly !== true) errors.push({ code: "WORKSPACE_ONLY_REQUIRED", field: "workspaceOnly", message: "workspaceOnly must be true." });
  if (!isPlainObject(workspace[REVIEW_DECISIONS_COLLECTION])) errors.push({ code: "COLLECTION_INVALID", field: REVIEW_DECISIONS_COLLECTION, message: "Collection must be an object." });
  if (errors.length) return errors;
  for (const [key, entity] of Object.entries(workspace[REVIEW_DECISIONS_COLLECTION])) {
    const validation = validateReviewDecision(entity);
    errors.push(...validation.errors.map((error) => ({ ...error, field: `${REVIEW_DECISIONS_COLLECTION}.${key}.${error.field}` })));
  }
  return errors;
}

export function loadReviewDecisions(storage) {
  if (!storage || typeof storage.getItem !== "function") return { ok: true, status: "empty", workspace: emptyWorkspace(), errors: [] };
  let raw;
  try {
    raw = storage.getItem(REVIEW_DECISION_STORAGE_KEY);
  } catch (error) {
    return { ok: false, status: "read_failed", workspace: emptyWorkspace(), errors: [{ code: "STORAGE_READ_FAILED", field: REVIEW_DECISION_STORAGE_KEY, message: error?.message || "Storage read failed." }] };
  }
  if (!raw) return { ok: true, status: "empty", workspace: emptyWorkspace(), errors: [] };
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, status: "corrupted", workspace: emptyWorkspace(), errors: [{ code: "JSON_PARSE_FAILED", field: REVIEW_DECISION_STORAGE_KEY, message: "Workspace JSON is corrupted." }] };
  }
  const errors = validateReviewDecisionWorkspace(parsed);
  return { ok: errors.length === 0, status: errors.length ? "corrupted" : "ready", workspace: errors.length ? emptyWorkspace() : parsed, errors };
}

export function saveReviewDecisionToWorkspace(workspace, decision) {
  const validation = validateReviewDecision(decision);
  if (!validation.valid) return { ok: false, status: "invalid", workspace, errors: validation.errors };
  const collection = workspace?.[REVIEW_DECISIONS_COLLECTION] || {};
  const key = getReviewDecisionStorageKey(decision.reviewCandidateId, decision.reviewCandidateVersion);
  if (!collection[key] && Object.keys(collection).length >= MAX_WORKSPACE_ITEMS) {
    return { ok: false, status: "limit_exceeded", workspace, errors: [{ code: "WORKSPACE_LIMIT_EXCEEDED", field: REVIEW_DECISION_STORAGE_KEY, message: "Workspace keeps at most 50 items." }] };
  }
  return {
    ok: true,
    status: "ready",
    workspace: {
      ...workspace,
      [REVIEW_DECISIONS_COLLECTION]: {
        ...collection,
        [key]: decision,
      },
    },
    errors: [],
  };
}

export function writeReviewDecisionWorkspace(storage, workspace) {
  const errors = validateReviewDecisionWorkspace(workspace);
  if (errors.length) return { ok: false, status: "invalid", errors };
  try {
    storage.setItem(REVIEW_DECISION_STORAGE_KEY, JSON.stringify(workspace));
    return { ok: true, status: "ready", errors: [] };
  } catch (error) {
    return { ok: false, status: "save_failed", errors: [{ code: "STORAGE_WRITE_FAILED", field: REVIEW_DECISION_STORAGE_KEY, message: error?.message || "Storage write failed." }] };
  }
}

export function getReviewDecisionForCandidate(workspace, reviewCandidateId, reviewCandidateVersion) {
  return workspace?.[REVIEW_DECISIONS_COLLECTION]?.[getReviewDecisionStorageKey(reviewCandidateId, reviewCandidateVersion)] || null;
}
