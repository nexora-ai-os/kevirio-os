import { DATA_MODES, MARKET_INTELLIGENCE_SCHEMA_VERSION } from "../data/marketIntelligenceSchemas.js";
import { createDeterministicId } from "./marketIntelligenceEngine.js";

export const CAMPAIGN_CANDIDATE_STORAGE_KEY = "kevirio:campaign-candidates:v2";
export const CONTENT_BRIEF_CANDIDATE_STORAGE_KEY = "kevirio:content-brief-candidates:v2";

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

function validateSafety(entity, errors) {
  if (entity.schemaVersion !== MARKET_INTELLIGENCE_SCHEMA_VERSION) errors.push({ code: "SCHEMA_VERSION_MISMATCH", field: "schemaVersion", message: "schemaVersion mismatch." });
  if (entity.dataMode !== DATA_MODES.MOCK) errors.push({ code: "REAL_DATA_NOT_ALLOWED", field: "dataMode", message: "Only mock is allowed." });
  if (entity.isMock !== true) errors.push({ code: "MOCK_REQUIRED", field: "isMock", message: "isMock must be true." });
  if (entity.productionExecution !== false) errors.push({ code: "PRODUCTION_FORBIDDEN", field: "productionExecution", message: "productionExecution must be false." });
  if (entity.externalExecution !== false) errors.push({ code: "EXTERNAL_FORBIDDEN", field: "externalExecution", message: "externalExecution must be false." });
  if (entity.approvalConfirmed !== false) errors.push({ code: "APPROVAL_FORBIDDEN", field: "approvalConfirmed", message: "approvalConfirmed must be false." });
  if (entity.ledgerAppend !== false) errors.push({ code: "LEDGER_FORBIDDEN", field: "ledgerAppend", message: "ledgerAppend must be false." });
  if ("publishEnabled" in entity && entity.publishEnabled !== false) errors.push({ code: "PUBLISH_FORBIDDEN", field: "publishEnabled", message: "publishEnabled must be false." });
  if ("actualRevenueConnected" in entity && entity.actualRevenueConnected !== false) errors.push({ code: "ACTUAL_REVENUE_FORBIDDEN", field: "actualRevenueConnected", message: "actualRevenueConnected must be false." });
}

function assertRequired(entity, fields, errors) {
  for (const field of fields) {
    if (entity[field] === undefined || entity[field] === null || entity[field] === "") {
      errors.push({ code: "REQUIRED_FIELD_MISSING", field, message: `${field} is required.` });
    }
  }
}

function yenLabel(range) {
  if (!range) return "Sandbox想定売上は未確定";
  return `Sandbox想定売上 ${Number(range.low || 0).toLocaleString("ja-JP")}円〜${Number(range.base || 0).toLocaleString("ja-JP")}円`;
}

export function getCampaignCandidateId(handoffId) {
  return createDeterministicId("campaign-candidate", {
    handoffId,
    schemaVersion: MARKET_INTELLIGENCE_SCHEMA_VERSION,
    dataMode: DATA_MODES.MOCK,
  }).id;
}

export function getContentBriefId(campaignCandidateId) {
  return createDeterministicId("content-brief-candidate", {
    campaignCandidateId,
    schemaVersion: MARKET_INTELLIGENCE_SCHEMA_VERSION,
    dataMode: DATA_MODES.MOCK,
  }).id;
}

export function createCampaignDraftCandidate(handoff, createdAt) {
  const campaignCandidateId = getCampaignCandidateId(handoff?.handoffId);
  const objective = handoff?.lane === "asset"
    ? "AIが継続運用できる収益資産の検証"
    : "30日以内の初回売上に向けた短期検証";
  const offerConcept = `${handoff?.customerProblem || "顧客課題"}に対して、${handoff?.recommendedChannel || "主要チャネル"}で小さく検証するMock提案`;
  return {
    campaignCandidateId,
    handoffId: handoff?.handoffId,
    correlationId: handoff?.correlationId,
    schemaVersion: MARKET_INTELLIGENCE_SCHEMA_VERSION,
    dataMode: DATA_MODES.MOCK,
    isMock: true,
    campaignTitle: `${handoff?.title || "Market Opportunity"} / Mock Campaign案`,
    objective,
    targetAudience: handoff?.targetAudience,
    customerProblem: handoff?.customerProblem,
    valueProposition: `${handoff?.title || "市場候補"}をOwnerレビュー用に1つの提案へ整理`,
    revenueModel: handoff?.revenueModel,
    primaryChannel: handoff?.recommendedChannel,
    offerConcept,
    callToAction: "OwnerレビューでMock Campaign案を確認する",
    forecastRevenueRange: handoff?.forecastRevenueRange,
    assumptions: Array.isArray(handoff?.assumptions) ? [...handoff.assumptions] : [],
    riskFlags: Array.isArray(handoff?.riskFlags) ? [...handoff.riskFlags] : [],
    status: "draftCandidate",
    productionExecution: false,
    externalExecution: false,
    approvalConfirmed: false,
    publishEnabled: false,
    ledgerAppend: false,
    actualRevenueConnected: false,
    createdAt,
  };
}

export function createContentBriefCandidate(campaignCandidate, createdAt) {
  const contentBriefId = getContentBriefId(campaignCandidate?.campaignCandidateId);
  return {
    contentBriefId,
    campaignCandidateId: campaignCandidate?.campaignCandidateId,
    correlationId: campaignCandidate?.correlationId,
    schemaVersion: MARKET_INTELLIGENCE_SCHEMA_VERSION,
    contentType: "Owner Review Draft",
    workingTitle: `${campaignCandidate?.campaignTitle || "Mock Campaign案"} / Content Brief`,
    targetAudience: campaignCandidate?.targetAudience,
    customerProblem: campaignCandidate?.customerProblem,
    coreMessage: campaignCandidate?.valueProposition,
    offer: campaignCandidate?.offerConcept,
    callToAction: campaignCandidate?.callToAction,
    recommendedChannel: campaignCandidate?.primaryChannel,
    outline: [
      "市場機会の要点",
      "顧客課題と対象者",
      "Mock Campaign案",
      "Ownerが確認するリスク",
      "次Sprintで作る成果物",
    ],
    requiredEvidence: Array.isArray(campaignCandidate?.assumptions) ? [...campaignCandidate.assumptions] : [],
    prohibitedClaims: [
      "実売上が確定したという表現",
      "Production公開済みという表現",
      "外部送信済みという表現",
    ],
    riskNotes: Array.isArray(campaignCandidate?.riskFlags) && campaignCandidate.riskFlags.length
      ? [...campaignCandidate.riskFlags]
      : ["重大なリスクはMock評価上検出されていません"],
    draftPreview: `${campaignCandidate?.targetAudience || "対象者"}向けに、${campaignCandidate?.primaryChannel || "主要チャネル"}で${campaignCandidate?.offerConcept || "小さな提案"}を検証します。${yenLabel(campaignCandidate?.forecastRevenueRange)}として扱い、実売上とは分離します。`,
    status: "briefCandidate",
    dataMode: DATA_MODES.MOCK,
    isMock: true,
    externalExecution: false,
    productionExecution: false,
    publishEnabled: false,
    approvalConfirmed: false,
    ledgerAppend: false,
    createdAt,
  };
}

export function validateCampaignDraftCandidate(candidate) {
  const errors = [];
  if (!isPlainObject(candidate)) {
    return { valid: false, errors: [{ code: "CANDIDATE_INVALID", field: "candidate", message: "Campaign Candidate must be an object." }] };
  }
  assertRequired(candidate, [
    "campaignCandidateId",
    "handoffId",
    "correlationId",
    "schemaVersion",
    "campaignTitle",
    "objective",
    "targetAudience",
    "customerProblem",
    "valueProposition",
    "revenueModel",
    "primaryChannel",
    "offerConcept",
    "callToAction",
    "forecastRevenueRange",
    "status",
    "createdAt",
  ], errors);
  validateSafety(candidate, errors);
  if (candidate.status !== "draftCandidate") errors.push({ code: "STATUS_INVALID", field: "status", message: "status must be draftCandidate." });
  if (!isPlainObject(candidate.forecastRevenueRange) || candidate.forecastRevenueRange.isMock !== true) {
    errors.push({ code: "FORECAST_INVALID", field: "forecastRevenueRange", message: "Mock forecastRevenueRange is required." });
  }
  if (candidate.campaignCandidateId !== getCampaignCandidateId(candidate.handoffId)) {
    errors.push({ code: "CAMPAIGN_CANDIDATE_ID_MISMATCH", field: "campaignCandidateId", message: "campaignCandidateId must be deterministic." });
  }
  collectForbiddenFields(candidate, errors);
  return { valid: errors.length === 0, errors };
}

export function validateContentBriefCandidate(brief) {
  const errors = [];
  if (!isPlainObject(brief)) {
    return { valid: false, errors: [{ code: "BRIEF_INVALID", field: "brief", message: "Content Brief must be an object." }] };
  }
  assertRequired(brief, [
    "contentBriefId",
    "campaignCandidateId",
    "correlationId",
    "schemaVersion",
    "contentType",
    "workingTitle",
    "targetAudience",
    "customerProblem",
    "coreMessage",
    "offer",
    "callToAction",
    "recommendedChannel",
    "outline",
    "requiredEvidence",
    "prohibitedClaims",
    "riskNotes",
    "draftPreview",
    "status",
    "createdAt",
  ], errors);
  validateSafety(brief, errors);
  if (brief.status !== "briefCandidate") errors.push({ code: "STATUS_INVALID", field: "status", message: "status must be briefCandidate." });
  if (!Array.isArray(brief.outline) || brief.outline.length === 0) errors.push({ code: "OUTLINE_REQUIRED", field: "outline", message: "outline is required." });
  if (!Array.isArray(brief.prohibitedClaims) || brief.prohibitedClaims.length === 0) errors.push({ code: "PROHIBITED_CLAIMS_REQUIRED", field: "prohibitedClaims", message: "prohibitedClaims is required." });
  if (!Array.isArray(brief.riskNotes) || brief.riskNotes.length === 0) errors.push({ code: "RISK_NOTES_REQUIRED", field: "riskNotes", message: "riskNotes is required." });
  if (brief.contentBriefId !== getContentBriefId(brief.campaignCandidateId)) {
    errors.push({ code: "CONTENT_BRIEF_ID_MISMATCH", field: "contentBriefId", message: "contentBriefId must be deterministic." });
  }
  collectForbiddenFields(brief, errors);
  return { valid: errors.length === 0, errors };
}
