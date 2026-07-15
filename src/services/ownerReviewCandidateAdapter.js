import { DATA_MODES, MARKET_INTELLIGENCE_SCHEMA_VERSION } from "../data/marketIntelligenceSchemas.js";
import { createDeterministicId } from "./marketIntelligenceEngine.js";
import {
  CAMPAIGN_HANDOFF_STORAGE_KEY,
  createCampaignRecommendationHandoff,
  validateCampaignRecommendationHandoff,
} from "./campaignRecommendationHandoffService.js";
import {
  CAMPAIGN_CANDIDATE_STORAGE_KEY,
  CONTENT_BRIEF_CANDIDATE_STORAGE_KEY,
  createCampaignDraftCandidate,
  createContentBriefCandidate,
  validateCampaignDraftCandidate,
  validateContentBriefCandidate,
} from "./marketCampaignCandidateService.js";

export const OWNER_REVIEW_CANDIDATE_STORAGE_KEY = "kevirio:owner-review-candidates:v2";

const MAX_WORKSPACE_ITEMS = 50;
const COLLECTION_BY_KEY = Object.freeze({
  [CAMPAIGN_HANDOFF_STORAGE_KEY]: "handoffsByKey",
  [CAMPAIGN_CANDIDATE_STORAGE_KEY]: "campaignCandidatesById",
  [CONTENT_BRIEF_CANDIDATE_STORAGE_KEY]: "contentBriefCandidatesById",
  [OWNER_REVIEW_CANDIDATE_STORAGE_KEY]: "reviewCandidatesById",
});

const VALIDATORS_BY_KEY = Object.freeze({
  [CAMPAIGN_HANDOFF_STORAGE_KEY]: validateCampaignRecommendationHandoff,
  [CAMPAIGN_CANDIDATE_STORAGE_KEY]: validateCampaignDraftCandidate,
  [CONTENT_BRIEF_CANDIDATE_STORAGE_KEY]: validateContentBriefCandidate,
  [OWNER_REVIEW_CANDIDATE_STORAGE_KEY]: validateOwnerReviewCandidate,
});

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function emptyWorkspace(storageKey) {
  return {
    schemaVersion: MARKET_INTELLIGENCE_SCHEMA_VERSION,
    dataMode: DATA_MODES.MOCK,
    isMock: true,
    workspaceOnly: true,
    [COLLECTION_BY_KEY[storageKey]]: {},
  };
}

function createResult(ok, status, workspaces, payload = {}, errors = []) {
  return { ok, status, workspaces, payload, errors };
}

function getItem(storage, key) {
  if (!storage || typeof storage.getItem !== "function") return { ok: true, value: null };
  try {
    return { ok: true, value: storage.getItem(key) };
  } catch (error) {
    return { ok: false, errors: [{ code: "STORAGE_READ_FAILED", field: key, message: error?.message || "Storage read failed." }] };
  }
}

function setItem(storage, key, value) {
  if (!storage || typeof storage.setItem !== "function") {
    return { ok: false, errors: [{ code: "STORAGE_WRITE_UNAVAILABLE", field: key, message: "Storage writer is unavailable." }] };
  }
  try {
    storage.setItem(key, JSON.stringify(value));
    return { ok: true, errors: [] };
  } catch (error) {
    return { ok: false, errors: [{ code: "STORAGE_WRITE_FAILED", field: key, message: error?.message || "Storage write failed." }] };
  }
}

function writeWorkspace(storage, storageKey, workspace) {
  const validationErrors = validateWorkspace(storageKey, workspace);
  if (validationErrors.length) {
    return { ok: false, status: "invalid", errors: validationErrors };
  }
  const write = setItem(storage, storageKey, workspace);
  return write.ok ? { ok: true, status: "ready", errors: [] } : { ok: false, status: "save_failed", errors: write.errors };
}

function rollback(storage, originals) {
  if (!storage || typeof storage.setItem !== "function" || typeof storage.removeItem !== "function") return;
  for (const [key, original] of originals) {
    if (original === null || original === undefined) {
      storage.removeItem(key);
    } else {
      storage.setItem(key, original);
    }
  }
}

function validateWorkspace(storageKey, workspace) {
  const errors = [];
  const collectionName = COLLECTION_BY_KEY[storageKey];
  if (!isPlainObject(workspace)) {
    return [{ code: "WORKSPACE_INVALID", field: storageKey, message: "Workspace must be an object." }];
  }
  if (workspace.schemaVersion !== MARKET_INTELLIGENCE_SCHEMA_VERSION) errors.push({ code: "SCHEMA_VERSION_MISMATCH", field: "schemaVersion", message: "schemaVersion mismatch." });
  if (workspace.dataMode !== DATA_MODES.MOCK) errors.push({ code: "REAL_DATA_NOT_ALLOWED", field: "dataMode", message: "Only mock is allowed." });
  if (workspace.isMock !== true) errors.push({ code: "MOCK_REQUIRED", field: "isMock", message: "isMock must be true." });
  if (workspace.workspaceOnly !== true) errors.push({ code: "WORKSPACE_ONLY_REQUIRED", field: "workspaceOnly", message: "workspaceOnly must be true." });
  if (!isPlainObject(workspace[collectionName])) errors.push({ code: "COLLECTION_INVALID", field: collectionName, message: "Collection must be an object." });
  if (errors.length) return errors;
  const validator = VALIDATORS_BY_KEY[storageKey];
  for (const [key, entity] of Object.entries(workspace[collectionName])) {
    const validation = validator(entity);
    errors.push(...validation.errors.map((error) => ({ ...error, field: `${collectionName}.${key}.${error.field}` })));
  }
  return errors;
}

function loadWorkspace(storage, storageKey) {
  const read = getItem(storage, storageKey);
  if (!read.ok) return { ok: false, workspace: emptyWorkspace(storageKey), errors: read.errors };
  if (!read.value) return { ok: true, workspace: emptyWorkspace(storageKey), status: "empty" };
  let parsed;
  try {
    parsed = JSON.parse(read.value);
  } catch {
    return { ok: false, workspace: emptyWorkspace(storageKey), errors: [{ code: "JSON_PARSE_FAILED", field: storageKey, message: "Workspace JSON is corrupted." }] };
  }
  const errors = validateWorkspace(storageKey, parsed);
  return { ok: errors.length === 0, workspace: errors.length ? emptyWorkspace(storageKey) : parsed, errors };
}

function cloneWithEntity(workspace, storageKey, entityKey, entity) {
  const collectionName = COLLECTION_BY_KEY[storageKey];
  return {
    ...workspace,
    [collectionName]: {
      ...workspace[collectionName],
      [entityKey]: entity,
    },
  };
}

function canInsert(workspace, storageKey, entityKey) {
  const collection = workspace[COLLECTION_BY_KEY[storageKey]];
  return Boolean(collection[entityKey]) || Object.keys(collection).length < MAX_WORKSPACE_ITEMS;
}

function getReviewCandidateId(contentBriefId) {
  return createDeterministicId("owner-review-candidate", {
    contentBriefId,
    schemaVersion: MARKET_INTELLIGENCE_SCHEMA_VERSION,
    dataMode: DATA_MODES.MOCK,
  }).id;
}

export function createOwnerReviewCandidate(handoff, campaignCandidate, contentBrief, createdAt) {
  const reviewCandidateId = getReviewCandidateId(contentBrief?.contentBriefId);
  return {
    reviewCandidateId,
    handoffId: handoff?.handoffId,
    ownerDecisionId: handoff?.ownerDecisionId,
    campaignCandidateId: campaignCandidate?.campaignCandidateId,
    contentBriefId: contentBrief?.contentBriefId,
    correlationId: handoff?.correlationId,
    schemaVersion: MARKET_INTELLIGENCE_SCHEMA_VERSION,
    dataMode: DATA_MODES.MOCK,
    isMock: true,
    workspaceOnly: true,
    title: campaignCandidate?.campaignTitle,
    ownerNextAction: "レビュー",
    status: "reviewPending",
    queueLabel: "Owner Review Queue",
    campaignSummary: {
      objective: campaignCandidate?.objective,
      targetAudience: campaignCandidate?.targetAudience,
      primaryChannel: campaignCandidate?.primaryChannel,
      offerConcept: campaignCandidate?.offerConcept,
      forecastRevenueRange: campaignCandidate?.forecastRevenueRange,
    },
    contentBriefPreview: {
      workingTitle: contentBrief?.workingTitle,
      targetAudience: contentBrief?.targetAudience,
      draftPreview: contentBrief?.draftPreview,
      prohibitedClaims: contentBrief?.prohibitedClaims || [],
      riskNotes: contentBrief?.riskNotes || [],
    },
    productionExecution: false,
    externalExecution: false,
    approvalConfirmed: false,
    publishEnabled: false,
    ledgerAppend: false,
    actualRevenueConnected: false,
    createdAt,
  };
}

export function validateOwnerReviewCandidate(candidate) {
  const errors = [];
  if (!isPlainObject(candidate)) {
    return { valid: false, errors: [{ code: "REVIEW_CANDIDATE_INVALID", field: "candidate", message: "Review Candidate must be an object." }] };
  }
  const required = [
    "reviewCandidateId",
    "handoffId",
    "ownerDecisionId",
    "campaignCandidateId",
    "contentBriefId",
    "correlationId",
    "schemaVersion",
    "dataMode",
    "isMock",
    "workspaceOnly",
    "title",
    "ownerNextAction",
    "status",
    "queueLabel",
    "campaignSummary",
    "contentBriefPreview",
    "createdAt",
  ];
  for (const field of required) {
    if (candidate[field] === undefined || candidate[field] === null || candidate[field] === "") {
      errors.push({ code: "REQUIRED_FIELD_MISSING", field, message: `${field} is required.` });
    }
  }
  if (candidate.schemaVersion !== MARKET_INTELLIGENCE_SCHEMA_VERSION) errors.push({ code: "SCHEMA_VERSION_MISMATCH", field: "schemaVersion", message: "schemaVersion mismatch." });
  if (candidate.dataMode !== DATA_MODES.MOCK) errors.push({ code: "REAL_DATA_NOT_ALLOWED", field: "dataMode", message: "Only mock is allowed." });
  if (candidate.isMock !== true) errors.push({ code: "MOCK_REQUIRED", field: "isMock", message: "isMock must be true." });
  if (candidate.workspaceOnly !== true) errors.push({ code: "WORKSPACE_ONLY_REQUIRED", field: "workspaceOnly", message: "workspaceOnly must be true." });
  if (!["reviewPending", "superseded"].includes(candidate.status)) errors.push({ code: "STATUS_INVALID", field: "status", message: "status must be reviewPending or superseded." });
  if (candidate.productionExecution !== false) errors.push({ code: "PRODUCTION_FORBIDDEN", field: "productionExecution", message: "productionExecution must be false." });
  if (candidate.externalExecution !== false) errors.push({ code: "EXTERNAL_FORBIDDEN", field: "externalExecution", message: "externalExecution must be false." });
  if (candidate.approvalConfirmed !== false) errors.push({ code: "APPROVAL_FORBIDDEN", field: "approvalConfirmed", message: "approvalConfirmed must be false." });
  if (candidate.publishEnabled !== false) errors.push({ code: "PUBLISH_FORBIDDEN", field: "publishEnabled", message: "publishEnabled must be false." });
  if (candidate.ledgerAppend !== false) errors.push({ code: "LEDGER_FORBIDDEN", field: "ledgerAppend", message: "ledgerAppend must be false." });
  if (candidate.actualRevenueConnected !== false) errors.push({ code: "ACTUAL_REVENUE_FORBIDDEN", field: "actualRevenueConnected", message: "actualRevenueConnected must be false." });
  if (candidate.reviewCandidateId !== getReviewCandidateId(candidate.contentBriefId)) {
    errors.push({ code: "REVIEW_CANDIDATE_ID_MISMATCH", field: "reviewCandidateId", message: "reviewCandidateId must be deterministic." });
  }
  return { valid: errors.length === 0, errors };
}

export function loadOwnerReviewCandidates(storage) {
  return loadWorkspace(storage, OWNER_REVIEW_CANDIDATE_STORAGE_KEY);
}

export function getOwnerReviewCandidateForDecision(reviewWorkspace, ownerDecisionId) {
  if (!isPlainObject(reviewWorkspace?.reviewCandidatesById)) return null;
  return Object.values(reviewWorkspace.reviewCandidatesById).find((candidate) => candidate.ownerDecisionId === ownerDecisionId) || null;
}

export function buildOwnerReviewQueueViewModel(loadResult) {
  if (!loadResult?.ok) {
    return {
      ok: false,
      status: "corrupted",
      items: [],
      message: "レビュー待ちデータを確認できないため、安全のため表示を停止しています。",
    };
  }
  const candidates = Object.values(loadResult.workspace?.reviewCandidatesById || {});
  const items = candidates
    .filter((candidate) => candidate.status === "reviewPending")
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))
    .map((candidate) => ({
      reviewCandidateId: candidate.reviewCandidateId,
      title: candidate.title,
      status: candidate.status,
      ownerNextAction: candidate.ownerNextAction,
      campaignTitle: candidate.title,
      targetAudience: candidate.campaignSummary?.targetAudience || candidate.contentBriefPreview?.targetAudience || "要確認",
      offerConcept: candidate.campaignSummary?.offerConcept || "要確認",
      valueProposition: candidate.contentBriefPreview?.workingTitle || "要確認",
      channel: candidate.campaignSummary?.primaryChannel || "要確認",
      contentBrief: candidate.contentBriefPreview?.workingTitle || "要確認",
      draftPreview: candidate.contentBriefPreview?.draftPreview || "要確認",
      riskNotes: candidate.contentBriefPreview?.riskNotes || [],
      prohibitedClaims: candidate.contentBriefPreview?.prohibitedClaims || [],
      mockLabel: "Mock成果物レビュー待ち",
      safetyLabel: "公開・外部送信・実売上には接続されていません",
    }));
  return {
    ok: true,
    status: "ready",
    items,
    message: items.length ? "Mock成果物レビュー待ちがあります。" : "Market由来のレビュー待ちはありません。",
  };
}

export function markOwnerReviewCandidateSuperseded(storage, ownerDecisionId, supersededAt, reason = "owner_decision_changed") {
  const loaded = loadWorkspace(storage, OWNER_REVIEW_CANDIDATE_STORAGE_KEY);
  if (!loaded.ok) return { ok: false, status: "corrupted", errors: loaded.errors };
  const existing = getOwnerReviewCandidateForDecision(loaded.workspace, ownerDecisionId);
  if (!existing) return { ok: true, status: "not_found", workspace: loaded.workspace, errors: [] };
  if (existing.status === "superseded") return { ok: true, status: "superseded", workspace: loaded.workspace, errors: [] };
  const nextWorkspace = cloneWithEntity(
    loaded.workspace,
    OWNER_REVIEW_CANDIDATE_STORAGE_KEY,
    existing.reviewCandidateId,
    {
      ...existing,
      status: "superseded",
      supersededAt,
      supersededReason: reason,
    }
  );
  const write = writeWorkspace(storage, OWNER_REVIEW_CANDIDATE_STORAGE_KEY, nextWorkspace);
  return { ...write, workspace: write.ok ? nextWorkspace : loaded.workspace };
}

export function saveRevenueDecisionVerticalSlice(storage, { recommendation, ownerDecision, createdAt }) {
  if (ownerDecision?.decision !== "approved") {
    return createResult(false, "owner_decision_not_approved", {}, {}, [{ code: "OWNER_DECISION_NOT_APPROVED", field: "ownerDecision", message: "Only approved decisions can create downstream candidates." }]);
  }

  const handoff = createCampaignRecommendationHandoff(recommendation, ownerDecision, createdAt);
  const campaignCandidate = createCampaignDraftCandidate(handoff, createdAt);
  const contentBrief = createContentBriefCandidate(campaignCandidate, createdAt);
  const reviewCandidate = createOwnerReviewCandidate(handoff, campaignCandidate, contentBrief, createdAt);

  const validations = [
    validateCampaignRecommendationHandoff(handoff, ownerDecision),
    validateCampaignDraftCandidate(campaignCandidate),
    validateContentBriefCandidate(contentBrief),
    validateOwnerReviewCandidate(reviewCandidate),
  ];
  const validationErrors = validations.flatMap((validation) => validation.errors);
  if (validationErrors.length) {
    return createResult(false, "invalid", {}, { handoff, campaignCandidate, contentBrief, reviewCandidate }, validationErrors);
  }

  const storageKeys = [
    CAMPAIGN_HANDOFF_STORAGE_KEY,
    CAMPAIGN_CANDIDATE_STORAGE_KEY,
    CONTENT_BRIEF_CANDIDATE_STORAGE_KEY,
    OWNER_REVIEW_CANDIDATE_STORAGE_KEY,
  ];
  const loaded = Object.fromEntries(storageKeys.map((key) => [key, loadWorkspace(storage, key)]));
  const loadErrors = Object.entries(loaded).flatMap(([key, result]) => result.ok ? [] : result.errors.map((error) => ({ ...error, field: `${key}.${error.field}` })));
  if (loadErrors.length) {
    return createResult(false, "corrupted", Object.fromEntries(storageKeys.map((key) => [key, loaded[key].workspace])), {}, loadErrors);
  }

  const entityEntries = [
    [CAMPAIGN_HANDOFF_STORAGE_KEY, handoff.handoffKey, handoff],
    [CAMPAIGN_CANDIDATE_STORAGE_KEY, campaignCandidate.campaignCandidateId, campaignCandidate],
    [CONTENT_BRIEF_CANDIDATE_STORAGE_KEY, contentBrief.contentBriefId, contentBrief],
    [OWNER_REVIEW_CANDIDATE_STORAGE_KEY, reviewCandidate.reviewCandidateId, reviewCandidate],
  ];
  for (const [storageKey, entityKey] of entityEntries) {
    if (!canInsert(loaded[storageKey].workspace, storageKey, entityKey)) {
      return createResult(false, "limit_exceeded", Object.fromEntries(storageKeys.map((key) => [key, loaded[key].workspace])), {}, [{ code: "WORKSPACE_LIMIT_EXCEEDED", field: storageKey, message: "Workspace keeps at most 50 items." }]);
    }
  }

  const nextWorkspaces = Object.fromEntries(storageKeys.map((key) => [key, loaded[key].workspace]));
  for (const [storageKey, entityKey, entity] of entityEntries) {
    nextWorkspaces[storageKey] = cloneWithEntity(nextWorkspaces[storageKey], storageKey, entityKey, entity);
  }

  const originals = storageKeys.map((key) => [key, storage?.getItem?.(key) ?? null]);
  for (const storageKey of storageKeys) {
    const write = setItem(storage, storageKey, nextWorkspaces[storageKey]);
    if (!write.ok) {
      rollback(storage, originals);
      return createResult(false, "save_failed", nextWorkspaces, {}, write.errors);
    }
  }

  return createResult(true, "reviewPending", nextWorkspaces, {
    handoff,
    campaignCandidate,
    contentBrief,
    reviewCandidate,
  }, []);
}
