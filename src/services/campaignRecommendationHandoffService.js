import { DATA_MODES, MARKET_INTELLIGENCE_SCHEMA_VERSION } from "../data/marketIntelligenceSchemas.js";
import { createDeterministicId } from "./marketIntelligenceEngine.js";

export const CAMPAIGN_HANDOFF_STORAGE_KEY = "kevirio:campaign-handoffs:v2";

const FORBIDDEN_REVENUE_FIELDS = new Set([
  "actualRevenue",
  "realizedRevenue",
  "confirmedRevenue",
  "productionRevenue",
]);

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function collectForbiddenFields(value, errors, path = []) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((entry, index) => collectForbiddenFields(entry, errors, [...path, String(index)]));
    return;
  }
  for (const [key, entry] of Object.entries(value)) {
    if (FORBIDDEN_REVENUE_FIELDS.has(key)) {
      errors.push({ code: "ACTUAL_REVENUE_FIELD_FORBIDDEN", field: [...path, key].join("."), message: `${key} is not allowed.` });
    }
    collectForbiddenFields(entry, errors, [...path, key]);
  }
}

function assertIso(value, field, errors) {
  const time = Date.parse(value || "");
  if (typeof value !== "string" || !Number.isFinite(time) || new Date(time).toISOString() !== value) {
    errors.push({ code: "INVALID_ISO_TIME", field, message: `${field} must be ISO 8601.` });
  }
}

function recommendationIdOf(recommendation) {
  return `${recommendation?.opportunityId || ""}:${recommendation?.opportunityVersion || ""}`;
}

export function getCampaignHandoffKey(recommendationId, ownerDecisionId) {
  return createDeterministicId("campaign-handoff", {
    recommendationId,
    ownerDecisionId,
    schemaVersion: MARKET_INTELLIGENCE_SCHEMA_VERSION,
    dataMode: DATA_MODES.MOCK,
  }).id;
}

export function createCampaignRecommendationHandoff(recommendation, ownerDecision, createdAt) {
  const recommendationId = recommendationIdOf(recommendation);
  const handoffKey = getCampaignHandoffKey(recommendationId, ownerDecision?.decisionId);
  const primary = recommendation?.primary || {};
  const details = recommendation?.details || {};
  return {
    handoffId: handoffKey,
    handoffKey,
    schemaVersion: MARKET_INTELLIGENCE_SCHEMA_VERSION,
    dataMode: DATA_MODES.MOCK,
    isMock: true,
    recommendationId,
    opportunityId: recommendation?.opportunityId,
    opportunityVersion: recommendation?.opportunityVersion,
    marketId: recommendation?.marketId,
    ownerDecisionId: ownerDecision?.decisionId,
    correlationId: recommendation?.correlationId,
    lane: recommendation?.lane,
    title: primary.title,
    customerProblem: details.customerProblem,
    targetAudience: details.targetAudience,
    revenueModel: details.revenueModel,
    recommendedChannel: details.recommendedChannel,
    forecastRevenueRange: {
      ...primary.forecastRange,
      isMock: true,
    },
    assumptions: Array.isArray(details.assumptions) ? [...details.assumptions] : [],
    riskFlags: Array.isArray(details.riskFlags) ? [...details.riskFlags] : [],
    provenanceSummary: Array.isArray(details.provenanceSummary) ? [...details.provenanceSummary] : [],
    status: "handoffReady",
    productionExecution: false,
    externalExecution: false,
    approvalConfirmed: false,
    ledgerAppend: false,
    actualRevenueConnected: false,
    createdAt,
  };
}

export function validateCampaignRecommendationHandoff(handoff, ownerDecision) {
  const errors = [];
  if (!isPlainObject(handoff)) {
    return { valid: false, errors: [{ code: "HANDOFF_INVALID", field: "handoff", message: "Handoff must be an object." }] };
  }

  const required = [
    "handoffId",
    "handoffKey",
    "schemaVersion",
    "dataMode",
    "isMock",
    "recommendationId",
    "opportunityId",
    "opportunityVersion",
    "marketId",
    "ownerDecisionId",
    "correlationId",
    "lane",
    "title",
    "customerProblem",
    "targetAudience",
    "revenueModel",
    "recommendedChannel",
    "forecastRevenueRange",
    "status",
    "createdAt",
  ];
  for (const field of required) {
    if (handoff[field] === undefined || handoff[field] === null || handoff[field] === "") {
      errors.push({ code: "REQUIRED_FIELD_MISSING", field, message: `${field} is required.` });
    }
  }

  if (ownerDecision && ownerDecision.decision !== "approved") {
    errors.push({ code: "OWNER_DECISION_NOT_APPROVED", field: "ownerDecisionId", message: "Only approved owner decisions can create handoff." });
  }
  if (handoff.schemaVersion !== MARKET_INTELLIGENCE_SCHEMA_VERSION) errors.push({ code: "SCHEMA_VERSION_MISMATCH", field: "schemaVersion", message: "schemaVersion mismatch." });
  if (handoff.dataMode !== DATA_MODES.MOCK) errors.push({ code: "REAL_DATA_NOT_ALLOWED", field: "dataMode", message: "Only mock is allowed." });
  if (handoff.isMock !== true) errors.push({ code: "MOCK_REQUIRED", field: "isMock", message: "isMock must be true." });
  if (handoff.status !== "handoffReady") errors.push({ code: "STATUS_INVALID", field: "status", message: "status must be handoffReady." });
  if (handoff.productionExecution !== false) errors.push({ code: "PRODUCTION_FORBIDDEN", field: "productionExecution", message: "productionExecution must be false." });
  if (handoff.externalExecution !== false) errors.push({ code: "EXTERNAL_FORBIDDEN", field: "externalExecution", message: "externalExecution must be false." });
  if (handoff.approvalConfirmed !== false) errors.push({ code: "APPROVAL_FORBIDDEN", field: "approvalConfirmed", message: "approvalConfirmed must be false." });
  if (handoff.ledgerAppend !== false) errors.push({ code: "LEDGER_FORBIDDEN", field: "ledgerAppend", message: "ledgerAppend must be false." });
  if (handoff.actualRevenueConnected !== false) errors.push({ code: "ACTUAL_REVENUE_FORBIDDEN", field: "actualRevenueConnected", message: "actualRevenueConnected must be false." });
  if (!isPlainObject(handoff.forecastRevenueRange) || handoff.forecastRevenueRange.isMock !== true) {
    errors.push({ code: "FORECAST_INVALID", field: "forecastRevenueRange", message: "Mock forecastRevenueRange is required." });
  }
  assertIso(handoff.createdAt, "createdAt", errors);
  const expectedKey = getCampaignHandoffKey(handoff.recommendationId, handoff.ownerDecisionId);
  if (handoff.handoffKey !== expectedKey || handoff.handoffId !== expectedKey) {
    errors.push({ code: "HANDOFF_ID_MISMATCH", field: "handoffId", message: "Handoff ID must be deterministic." });
  }
  collectForbiddenFields(handoff, errors);
  return { valid: errors.length === 0, errors };
}
