import { DATA_MODES, MARKET_INTELLIGENCE_SCHEMA_VERSION } from "../data/marketIntelligenceSchemas.js";
import { createDeterministicId } from "./marketIntelligenceEngine.js";

export const REVISION_CANDIDATE_STORAGE_KEY = "kevirio:revision-candidates:v2";
export const REVISION_CANDIDATES_COLLECTION = "revisionCandidatesById";

const MAX_WORKSPACE_ITEMS = 50;
const MAX_REVISIONS = 3;

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function emptyWorkspace() {
  return {
    schemaVersion: MARKET_INTELLIGENCE_SCHEMA_VERSION,
    dataMode: DATA_MODES.MOCK,
    isMock: true,
    workspaceOnly: true,
    [REVISION_CANDIDATES_COLLECTION]: {},
  };
}

function safeText(value, fallback) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function getRevisionId(sourceReviewCandidateId, revisionNumber, reasonCode) {
  return createDeterministicId("revision-candidate", {
    sourceReviewCandidateId,
    revisionNumber,
    reasonCode,
    dataMode: DATA_MODES.MOCK,
  }).id;
}

export function getRevisionCandidatesForSource(workspace, sourceReviewCandidateId) {
  return Object.values(workspace?.[REVISION_CANDIDATES_COLLECTION] || {})
    .filter((revision) => revision.sourceReviewCandidateId === sourceReviewCandidateId)
    .sort((a, b) => Number(a.revisionNumber) - Number(b.revisionNumber));
}

export function getLatestRevisionCandidate(workspace, sourceReviewCandidateId) {
  const revisions = getRevisionCandidatesForSource(workspace, sourceReviewCandidateId);
  return revisions[revisions.length - 1] || null;
}

function buildRevisionPayload(reviewCandidate, reviewDecision, revisionNumber) {
  const campaign = reviewCandidate?.campaignSummary || {};
  const brief = reviewCandidate?.contentBriefPreview || {};
  const reasonCode = reviewDecision?.reasonCode || "CLARIFY_OFFER";
  const reasonText = safeText(reviewDecision?.reasonText, "Ownerが再レビューしやすい形へ調整");
  const toneDown = reasonCode === "TONE_DOWN_CLAIMS";
  const sharpen = reasonCode === "SHARPEN_TARGET";
  const title = safeText(reviewCandidate?.title, "Market由来Mock成果物");
  const target = sharpen
    ? `${safeText(campaign.targetAudience || brief.targetAudience, "対象者")}のうち、今週判断できるOwner`
    : safeText(campaign.targetAudience || brief.targetAudience, "対象者");
  const offer = toneDown
    ? `${safeText(campaign.offerConcept, title)}を、成果保証ではなく初回診断の提案として表現`
    : `${safeText(campaign.offerConcept, title)}を、Ownerが判断しやすい一文へ整理`;
  const draftPrefix = toneDown ? "効果を断定せず、確認できる範囲だけを伝えます。" : "最初の一歩を明確にして、判断負荷を下げます。";
  return {
    revisedCampaign: {
      title: `${title} 修正版${revisionNumber}`,
      targetAudience: target,
      channel: safeText(campaign.primaryChannel, "Sandbox"),
      offerConcept: offer,
      objective: safeText(campaign.objective, "Mock成果物を安全にレビューする"),
      forecastRevenueRange: campaign.forecastRevenueRange,
    },
    revisedContentBrief: {
      workingTitle: `${safeText(brief.workingTitle, title)} / 修正版${revisionNumber}`,
      targetAudience: target,
      riskNotes: Array.from(new Set([...(brief.riskNotes || []), "Mock修正です。外部公開・実売上確定は行いません。"])),
      prohibitedClaims: brief.prohibitedClaims || [],
    },
    revisedDraftPreview: `${draftPrefix}\n${safeText(brief.draftPreview, title)}\n\n修正理由: ${reasonText}`,
    changesSummary: [
      `${reasonText}に合わせてCampaignの見せ方を調整`,
      "Content Briefを再レビュー向けに短く整理",
      "Draft PreviewにMock安全境界を明記",
    ],
  };
}

export function createRevisionCandidate(reviewCandidate, reviewDecision, existingWorkspace = emptyWorkspace()) {
  if (reviewDecision?.decision !== "revisionRequested") {
    return { ok: false, status: "decision_not_revision", revisionCandidate: null, errors: [{ code: "REVISION_DECISION_REQUIRED", field: "decision", message: "Revision is generated only for revisionRequested." }] };
  }
  const existing = getRevisionCandidatesForSource(existingWorkspace, reviewCandidate?.reviewCandidateId);
  if (existing.length >= MAX_REVISIONS) {
    return { ok: false, status: "revision_limit_exceeded", revisionCandidate: null, errors: [{ code: "REVISION_LIMIT_EXCEEDED", field: "revisionNumber", message: "Revision is limited to three rounds." }] };
  }
  const revisionNumber = existing.length + 1;
  const previousRevision = existing[existing.length - 1] || null;
  const payload = buildRevisionPayload(reviewCandidate, reviewDecision, revisionNumber);
  const revisionCandidate = {
    revisionCandidateId: getRevisionId(reviewCandidate?.reviewCandidateId, revisionNumber, reviewDecision.reasonCode),
    sourceReviewCandidateId: reviewCandidate?.reviewCandidateId,
    previousRevisionCandidateId: previousRevision?.revisionCandidateId || null,
    revisionNumber,
    correlationId: reviewCandidate?.correlationId,
    schemaVersion: MARKET_INTELLIGENCE_SCHEMA_VERSION,
    dataMode: DATA_MODES.MOCK,
    isMock: true,
    revisionReasonCode: reviewDecision.reasonCode,
    revisionReasonText: reviewDecision.reasonText,
    revisedCampaign: payload.revisedCampaign,
    revisedContentBrief: payload.revisedContentBrief,
    revisedDraftPreview: payload.revisedDraftPreview,
    changesSummary: payload.changesSummary,
    status: "reviewPending",
    productionExecution: false,
    externalExecution: false,
    approvalConfirmed: false,
    publishEnabled: false,
    ledgerAppend: false,
    actualRevenueConnected: false,
  };
  const validation = validateRevisionCandidate(revisionCandidate);
  return validation.valid ? { ok: true, status: "reviewPending", revisionCandidate, errors: [] } : { ok: false, status: "invalid", revisionCandidate, errors: validation.errors };
}

export function validateRevisionCandidate(revision) {
  const errors = [];
  if (!isPlainObject(revision)) {
    return { valid: false, errors: [{ code: "REVISION_INVALID", field: "revision", message: "Revision Candidate must be an object." }] };
  }
  for (const field of ["revisionCandidateId", "sourceReviewCandidateId", "revisionNumber", "correlationId", "schemaVersion", "dataMode", "isMock", "revisionReasonCode", "revisionReasonText", "revisedCampaign", "revisedContentBrief", "revisedDraftPreview", "changesSummary", "status"]) {
    if (revision[field] === undefined || revision[field] === null || revision[field] === "") {
      errors.push({ code: "REQUIRED_FIELD_MISSING", field, message: `${field} is required.` });
    }
  }
  if (revision.schemaVersion !== MARKET_INTELLIGENCE_SCHEMA_VERSION) errors.push({ code: "SCHEMA_VERSION_MISMATCH", field: "schemaVersion", message: "schemaVersion mismatch." });
  if (revision.dataMode !== DATA_MODES.MOCK) errors.push({ code: "REAL_DATA_NOT_ALLOWED", field: "dataMode", message: "Only mock is allowed." });
  if (revision.isMock !== true) errors.push({ code: "MOCK_REQUIRED", field: "isMock", message: "isMock must be true." });
  if (!Number.isInteger(revision.revisionNumber) || revision.revisionNumber < 1 || revision.revisionNumber > MAX_REVISIONS) errors.push({ code: "REVISION_NUMBER_INVALID", field: "revisionNumber", message: "revisionNumber must be 1 to 3." });
  if (revision.status !== "reviewPending") errors.push({ code: "STATUS_INVALID", field: "status", message: "status must be reviewPending." });
  if (!Array.isArray(revision.changesSummary) || revision.changesSummary.length < 3) errors.push({ code: "CHANGES_SUMMARY_INVALID", field: "changesSummary", message: "At least three changes are required." });
  if (revision.productionExecution !== false) errors.push({ code: "PRODUCTION_FORBIDDEN", field: "productionExecution", message: "productionExecution must be false." });
  if (revision.externalExecution !== false) errors.push({ code: "EXTERNAL_FORBIDDEN", field: "externalExecution", message: "externalExecution must be false." });
  if (revision.approvalConfirmed !== false) errors.push({ code: "APPROVAL_FORBIDDEN", field: "approvalConfirmed", message: "approvalConfirmed must be false." });
  if (revision.publishEnabled !== false) errors.push({ code: "PUBLISH_FORBIDDEN", field: "publishEnabled", message: "publishEnabled must be false." });
  if (revision.ledgerAppend !== false) errors.push({ code: "LEDGER_FORBIDDEN", field: "ledgerAppend", message: "ledgerAppend must be false." });
  if (revision.actualRevenueConnected !== false) errors.push({ code: "ACTUAL_REVENUE_FORBIDDEN", field: "actualRevenueConnected", message: "actualRevenueConnected must be false." });
  if (revision.revisionCandidateId !== getRevisionId(revision.sourceReviewCandidateId, revision.revisionNumber, revision.revisionReasonCode)) {
    errors.push({ code: "REVISION_ID_MISMATCH", field: "revisionCandidateId", message: "revisionCandidateId must be deterministic." });
  }
  return { valid: errors.length === 0, errors };
}

export function validateRevisionWorkspace(workspace) {
  const errors = [];
  if (!isPlainObject(workspace)) return [{ code: "WORKSPACE_INVALID", field: REVISION_CANDIDATE_STORAGE_KEY, message: "Workspace must be an object." }];
  if (workspace.schemaVersion !== MARKET_INTELLIGENCE_SCHEMA_VERSION) errors.push({ code: "SCHEMA_VERSION_MISMATCH", field: "schemaVersion", message: "schemaVersion mismatch." });
  if (workspace.dataMode !== DATA_MODES.MOCK) errors.push({ code: "REAL_DATA_NOT_ALLOWED", field: "dataMode", message: "Only mock is allowed." });
  if (workspace.isMock !== true) errors.push({ code: "MOCK_REQUIRED", field: "isMock", message: "isMock must be true." });
  if (workspace.workspaceOnly !== true) errors.push({ code: "WORKSPACE_ONLY_REQUIRED", field: "workspaceOnly", message: "workspaceOnly must be true." });
  if (!isPlainObject(workspace[REVISION_CANDIDATES_COLLECTION])) errors.push({ code: "COLLECTION_INVALID", field: REVISION_CANDIDATES_COLLECTION, message: "Collection must be an object." });
  if (errors.length) return errors;
  for (const [key, entity] of Object.entries(workspace[REVISION_CANDIDATES_COLLECTION])) {
    const validation = validateRevisionCandidate(entity);
    errors.push(...validation.errors.map((error) => ({ ...error, field: `${REVISION_CANDIDATES_COLLECTION}.${key}.${error.field}` })));
  }
  return errors;
}

export function loadRevisionCandidates(storage) {
  if (!storage || typeof storage.getItem !== "function") return { ok: true, status: "empty", workspace: emptyWorkspace(), errors: [] };
  let raw;
  try {
    raw = storage.getItem(REVISION_CANDIDATE_STORAGE_KEY);
  } catch (error) {
    return { ok: false, status: "read_failed", workspace: emptyWorkspace(), errors: [{ code: "STORAGE_READ_FAILED", field: REVISION_CANDIDATE_STORAGE_KEY, message: error?.message || "Storage read failed." }] };
  }
  if (!raw) return { ok: true, status: "empty", workspace: emptyWorkspace(), errors: [] };
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, status: "corrupted", workspace: emptyWorkspace(), errors: [{ code: "JSON_PARSE_FAILED", field: REVISION_CANDIDATE_STORAGE_KEY, message: "Workspace JSON is corrupted." }] };
  }
  const errors = validateRevisionWorkspace(parsed);
  return { ok: errors.length === 0, status: errors.length ? "corrupted" : "ready", workspace: errors.length ? emptyWorkspace() : parsed, errors };
}

export function saveRevisionCandidateToWorkspace(workspace, revisionCandidate) {
  const validation = validateRevisionCandidate(revisionCandidate);
  if (!validation.valid) return { ok: false, status: "invalid", workspace, errors: validation.errors };
  const collection = workspace?.[REVISION_CANDIDATES_COLLECTION] || {};
  if (!collection[revisionCandidate.revisionCandidateId] && Object.keys(collection).length >= MAX_WORKSPACE_ITEMS) {
    return { ok: false, status: "limit_exceeded", workspace, errors: [{ code: "WORKSPACE_LIMIT_EXCEEDED", field: REVISION_CANDIDATE_STORAGE_KEY, message: "Workspace keeps at most 50 items." }] };
  }
  return {
    ok: true,
    status: "ready",
    workspace: {
      ...workspace,
      [REVISION_CANDIDATES_COLLECTION]: {
        ...collection,
        [revisionCandidate.revisionCandidateId]: revisionCandidate,
      },
    },
    errors: [],
  };
}

export function writeRevisionWorkspace(storage, workspace) {
  const errors = validateRevisionWorkspace(workspace);
  if (errors.length) return { ok: false, status: "invalid", errors };
  try {
    storage.setItem(REVISION_CANDIDATE_STORAGE_KEY, JSON.stringify(workspace));
    return { ok: true, status: "ready", errors: [] };
  } catch (error) {
    return { ok: false, status: "save_failed", errors: [{ code: "STORAGE_WRITE_FAILED", field: REVISION_CANDIDATE_STORAGE_KEY, message: error?.message || "Storage write failed." }] };
  }
}
