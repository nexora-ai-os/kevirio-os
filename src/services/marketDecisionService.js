import { DATA_MODES, MARKET_INTELLIGENCE_SCHEMA_VERSION } from "../data/marketIntelligenceSchemas.js";
import { createDeterministicId } from "./marketIntelligenceEngine.js";

const STORAGE_KEY = "kevirio:market-decisions:v2";
const MAX_DECISIONS = 50;
const DECISION_SCHEMA_VERSION = MARKET_INTELLIGENCE_SCHEMA_VERSION;

const DECISIONS = Object.freeze({
  APPROVED: "approved",
  HOLD: "hold",
  REJECTED: "rejected",
});

const APPROVE_REASON = Object.freeze({
  OWNER_SELECTED_FOR_MOCK_CAMPAIGN: "Mock Campaign案の作成候補として選択",
});

const HOLD_REASONS = Object.freeze({
  NEEDS_MORE_EVIDENCE: "根拠を追加確認",
  REVIEW_LATER: "後でもう一度確認",
  BUDGET_REVIEW: "費用条件を確認",
});

const REJECT_REASONS = Object.freeze({
  NOT_STRATEGIC_FIT: "現在の方針に合わない",
  OWNER_EFFORT_TOO_HIGH: "Owner負荷が大きい",
  REVENUE_PATH_WEAK: "収益化経路が弱い",
});

const DEFAULT_REASON_BY_DECISION = Object.freeze({
  [DECISIONS.APPROVED]: "OWNER_SELECTED_FOR_MOCK_CAMPAIGN",
  [DECISIONS.HOLD]: "REVIEW_LATER",
  [DECISIONS.REJECTED]: "NOT_STRATEGIC_FIT",
});

const REASONS_BY_DECISION = Object.freeze({
  [DECISIONS.APPROVED]: APPROVE_REASON,
  [DECISIONS.HOLD]: HOLD_REASONS,
  [DECISIONS.REJECTED]: REJECT_REASONS,
});

const FORBIDDEN_REVENUE_FIELDS = new Set([
  "actualRevenue",
  "realizedRevenue",
  "confirmedRevenue",
  "productionRevenue",
]);

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function createEmptyWorkspace() {
  return {
    schemaVersion: DECISION_SCHEMA_VERSION,
    dataMode: DATA_MODES.MOCK,
    workspaceOnly: true,
    decisionsByOpportunityVersion: {},
  };
}

function createResult(ok, storageStatus, workspace, errors = []) {
  return { ok, storageStatus, workspace, errors };
}

function readStorage(storage) {
  if (!storage || typeof storage.getItem !== "function") {
    return { ok: true, value: null, storageStatus: "empty" };
  }
  try {
    return { ok: true, value: storage.getItem(STORAGE_KEY), storageStatus: "ready" };
  } catch (error) {
    return { ok: false, value: null, storageStatus: "unavailable", errors: [{ code: "STORAGE_READ_FAILED", message: error?.message || "Storage read failed." }] };
  }
}

function writeStorage(storage, workspace) {
  if (!storage || typeof storage.setItem !== "function") {
    return { ok: false, errors: [{ code: "STORAGE_WRITE_UNAVAILABLE", message: "Storage writer is unavailable." }] };
  }
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(workspace));
    return { ok: true, errors: [] };
  } catch (error) {
    return { ok: false, errors: [{ code: "STORAGE_WRITE_FAILED", message: error?.message || "Storage write failed." }] };
  }
}

function validateIsoString(value, field, errors) {
  if (typeof value !== "string") {
    errors.push({ code: "INVALID_ISO_TIME", field, message: `${field} must be an ISO 8601 string.` });
    return;
  }
  const time = Date.parse(value);
  if (!Number.isFinite(time) || new Date(time).toISOString() !== value) {
    errors.push({ code: "INVALID_ISO_TIME", field, message: `${field} must be an ISO 8601 string.` });
  }
}

function collectForbiddenFields(value, errors, path = []) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((entry, index) => collectForbiddenFields(entry, errors, [...path, String(index)]));
    return;
  }
  for (const [key, entry] of Object.entries(value)) {
    if (FORBIDDEN_REVENUE_FIELDS.has(key)) {
      errors.push({ code: "ACTUAL_REVENUE_FIELD_FORBIDDEN", field: [...path, key].join("."), message: `${key} is not allowed in Market Decision data.` });
    }
    collectForbiddenFields(entry, errors, [...path, key]);
  }
}

function normalizeReason(decision, reasonCode) {
  const normalizedDecision = Object.values(DECISIONS).includes(decision) ? decision : null;
  if (!normalizedDecision) return { reasonCode, reasonLabel: "" };
  const reasons = REASONS_BY_DECISION[normalizedDecision];
  const fallback = DEFAULT_REASON_BY_DECISION[normalizedDecision];
  const normalizedReasonCode = reasons[reasonCode] ? reasonCode : fallback;
  return {
    reasonCode: normalizedReasonCode,
    reasonLabel: reasons[normalizedReasonCode],
  };
}

function validateWorkspaceShape(workspace) {
  const errors = [];
  if (!isPlainObject(workspace)) {
    return [{ code: "WORKSPACE_INVALID", field: "workspace", message: "Decision workspace must be an object." }];
  }
  if (workspace.schemaVersion !== DECISION_SCHEMA_VERSION) {
    errors.push({ code: "SCHEMA_VERSION_MISMATCH", field: "schemaVersion", message: "Decision workspace schemaVersion does not match." });
  }
  if (workspace.dataMode !== DATA_MODES.MOCK) {
    errors.push({ code: "REAL_DATA_NOT_ALLOWED", field: "dataMode", message: "Only mock decision workspace is allowed." });
  }
  if (workspace.workspaceOnly !== true) {
    errors.push({ code: "WORKSPACE_ONLY_REQUIRED", field: "workspaceOnly", message: "Decision workspace must be workspace-only." });
  }
  if (!isPlainObject(workspace.decisionsByOpportunityVersion)) {
    errors.push({ code: "DECISIONS_OBJECT_INVALID", field: "decisionsByOpportunityVersion", message: "decisionsByOpportunityVersion must be an object." });
  }
  collectForbiddenFields(workspace, errors);
  return errors;
}

function validateWorkspace(workspace) {
  const errors = validateWorkspaceShape(workspace);
  if (errors.length) return errors;
  for (const [key, decision] of Object.entries(workspace.decisionsByOpportunityVersion)) {
    const expectedKey = decision ? getDecisionStorageKey(decision.opportunityId, decision.opportunityVersion) : "";
    if (key !== expectedKey) {
      errors.push({ code: "DECISION_KEY_MISMATCH", field: `decisionsByOpportunityVersion.${key}`, message: "Decision storage key must match opportunityId and opportunityVersion." });
    }
    const validation = validateMarketDecision(decision);
    errors.push(...validation.errors.map((error) => ({ ...error, field: `decisionsByOpportunityVersion.${key}.${error.field}` })));
  }
  return errors;
}

function cloneWorkspace(workspace) {
  return {
    schemaVersion: DECISION_SCHEMA_VERSION,
    dataMode: DATA_MODES.MOCK,
    workspaceOnly: true,
    decisionsByOpportunityVersion: {
      ...workspace.decisionsByOpportunityVersion,
    },
  };
}

export function getDecisionStorageKey(opportunityId, opportunityVersion) {
  return `${String(opportunityId || "")}:${String(opportunityVersion || "")}`;
}

export function validateMarketDecision(decision) {
  const errors = [];
  if (!isPlainObject(decision)) {
    return { valid: false, errors: [{ code: "DECISION_INVALID", field: "decision", message: "Decision must be an object." }] };
  }

  const requiredFields = [
    "schemaVersion",
    "decisionId",
    "opportunityId",
    "opportunityVersion",
    "marketId",
    "correlationId",
    "decision",
    "reasonCode",
    "reasonLabel",
    "decidedAt",
    "decidedBy",
    "dataMode",
    "isMock",
    "workspaceOnly",
    "ledgerAppend",
    "productionExecution",
    "externalExecution",
    "approvalConfirmed",
    "campaignHandoffCreated",
  ];

  for (const field of requiredFields) {
    if (decision[field] === undefined || decision[field] === null || decision[field] === "") {
      errors.push({ code: "REQUIRED_FIELD_MISSING", field, message: `${field} is required.` });
    }
  }

  if (decision.schemaVersion !== DECISION_SCHEMA_VERSION) errors.push({ code: "SCHEMA_VERSION_MISMATCH", field: "schemaVersion", message: "Decision schemaVersion does not match." });
  if (!Object.values(DECISIONS).includes(decision.decision)) errors.push({ code: "UNKNOWN_DECISION", field: "decision", message: "Decision must be approved, hold, or rejected." });
  const reasons = REASONS_BY_DECISION[decision.decision] || {};
  if (!reasons[decision.reasonCode]) errors.push({ code: "UNKNOWN_REASON_CODE", field: "reasonCode", message: "reasonCode is not allowed for this decision." });
  if (reasons[decision.reasonCode] && decision.reasonLabel !== reasons[decision.reasonCode]) errors.push({ code: "REASON_LABEL_MISMATCH", field: "reasonLabel", message: "reasonLabel must match reasonCode." });
  validateIsoString(decision.decidedAt, "decidedAt", errors);
  if (decision.decidedBy !== "owner") errors.push({ code: "DECIDED_BY_OWNER_REQUIRED", field: "decidedBy", message: "Decision must be made by owner." });
  if (decision.dataMode !== DATA_MODES.MOCK) errors.push({ code: "REAL_DATA_NOT_ALLOWED", field: "dataMode", message: "Only mock dataMode is allowed." });
  if (decision.isMock !== true) errors.push({ code: "MOCK_FLAG_REQUIRED", field: "isMock", message: "isMock must be true." });
  if (decision.workspaceOnly !== true) errors.push({ code: "WORKSPACE_ONLY_REQUIRED", field: "workspaceOnly", message: "workspaceOnly must be true." });
  if (decision.ledgerAppend !== false) errors.push({ code: "LEDGER_APPEND_FORBIDDEN", field: "ledgerAppend", message: "ledgerAppend must be false." });
  if (decision.productionExecution !== false) errors.push({ code: "PRODUCTION_FORBIDDEN", field: "productionExecution", message: "productionExecution must be false." });
  if (decision.externalExecution !== false) errors.push({ code: "EXTERNAL_EXECUTION_FORBIDDEN", field: "externalExecution", message: "externalExecution must be false." });
  if (decision.approvalConfirmed !== false) errors.push({ code: "APPROVAL_CONFIRMED_FORBIDDEN", field: "approvalConfirmed", message: "approvalConfirmed must be false." });
  if (decision.campaignHandoffCreated !== false) errors.push({ code: "CAMPAIGN_HANDOFF_FORBIDDEN", field: "campaignHandoffCreated", message: "campaignHandoffCreated must be false." });

  const expectedDecisionId = createDeterministicId("market-decision", {
    schemaVersion: DECISION_SCHEMA_VERSION,
    opportunityId: decision.opportunityId,
    opportunityVersion: decision.opportunityVersion,
    dataMode: DATA_MODES.MOCK,
  }).id;
  if (decision.decisionId !== expectedDecisionId) {
    errors.push({ code: "DECISION_ID_MISMATCH", field: "decisionId", message: "decisionId must be deterministic for the opportunity version." });
  }

  collectForbiddenFields(decision, errors);
  return { valid: errors.length === 0, errors };
}

export function createMarketDecision(decisionInput, decidedAt) {
  const input = isPlainObject(decisionInput) ? decisionInput : {};
  const decision = Object.values(DECISIONS).includes(input.decision) ? input.decision : input.decision;
  const reason = normalizeReason(decision, input.reasonCode);
  return {
    schemaVersion: DECISION_SCHEMA_VERSION,
    decisionId: createDeterministicId("market-decision", {
      schemaVersion: DECISION_SCHEMA_VERSION,
      opportunityId: input.opportunityId,
      opportunityVersion: input.opportunityVersion,
      dataMode: DATA_MODES.MOCK,
    }).id,
    opportunityId: input.opportunityId,
    opportunityVersion: input.opportunityVersion,
    marketId: input.marketId,
    correlationId: input.correlationId,
    decision,
    reasonCode: reason.reasonCode,
    reasonLabel: reason.reasonLabel,
    decidedAt,
    decidedBy: "owner",
    dataMode: DATA_MODES.MOCK,
    isMock: true,
    workspaceOnly: true,
    ledgerAppend: false,
    productionExecution: false,
    externalExecution: false,
    approvalConfirmed: false,
    campaignHandoffCreated: false,
  };
}

export function loadMarketDecisions(storage) {
  const read = readStorage(storage);
  if (!read.ok) {
    return createResult(false, read.storageStatus, createEmptyWorkspace(), read.errors);
  }
  if (!read.value) {
    return createResult(true, "empty", createEmptyWorkspace(), []);
  }

  let parsed;
  try {
    parsed = JSON.parse(read.value);
  } catch {
    return createResult(false, "corrupted", createEmptyWorkspace(), [{ code: "JSON_PARSE_FAILED", field: STORAGE_KEY, message: "Decision workspace JSON is corrupted." }]);
  }

  const errors = validateWorkspace(parsed);
  if (errors.length) {
    return createResult(false, "corrupted", createEmptyWorkspace(), errors);
  }

  return createResult(true, "ready", parsed, []);
}

export function getMarketDecisionForOpportunity(decisionWorkspace, opportunityId, opportunityVersion) {
  if (!isPlainObject(decisionWorkspace) || !isPlainObject(decisionWorkspace.decisionsByOpportunityVersion)) return null;
  return decisionWorkspace.decisionsByOpportunityVersion[getDecisionStorageKey(opportunityId, opportunityVersion)] || null;
}

export function saveMarketDecision(storage, decisionInput) {
  const loaded = loadMarketDecisions(storage);
  if (!loaded.ok) {
    return { ...loaded, saved: false };
  }

  const decision = createMarketDecision(decisionInput, decisionInput?.decidedAt);
  const validation = validateMarketDecision(decision);
  if (!validation.valid) {
    return createResult(false, "invalid", loaded.workspace, validation.errors);
  }

  const key = getDecisionStorageKey(decision.opportunityId, decision.opportunityVersion);
  const existing = loaded.workspace.decisionsByOpportunityVersion[key];
  if (existing?.campaignHandoffCreated === true) {
    return createResult(false, "handoff_locked", loaded.workspace, [{ code: "CAMPAIGN_HANDOFF_LOCKED", field: key, message: "Decision cannot change after campaign handoff." }]);
  }

  const existingCount = Object.keys(loaded.workspace.decisionsByOpportunityVersion).length;
  if (!existing && existingCount >= MAX_DECISIONS) {
    return createResult(false, "limit_exceeded", loaded.workspace, [{ code: "DECISION_LIMIT_EXCEEDED", field: STORAGE_KEY, message: "Decision workspace keeps at most 50 decisions." }]);
  }

  const nextWorkspace = cloneWorkspace(loaded.workspace);
  nextWorkspace.decisionsByOpportunityVersion[key] = decision;
  const write = writeStorage(storage, nextWorkspace);
  if (!write.ok) {
    return createResult(false, "save_failed", loaded.workspace, write.errors);
  }

  return { ...createResult(true, "ready", nextWorkspace, []), saved: true, decision };
}
