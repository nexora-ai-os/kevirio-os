import {
  REVIEW_DECISION_STORAGE_KEY,
  createReviewDecision,
  getReviewDecisionForCandidate,
  getReviewCandidateVersion,
  loadReviewDecisions,
  saveReviewDecisionToWorkspace,
  writeReviewDecisionWorkspace,
} from "./ownerReviewDecisionService.js";
import {
  REVISION_CANDIDATE_STORAGE_KEY,
  createRevisionCandidate,
  getLatestRevisionCandidate,
  loadRevisionCandidates,
  saveRevisionCandidateToWorkspace,
  writeRevisionWorkspace,
} from "./revisionCandidateService.js";
import {
  IMPROVEMENT_RECOMMENDATION_STORAGE_KEY,
  PUBLISH_READY_EXPORT_STORAGE_KEY,
  SANDBOX_PERFORMANCE_STORAGE_KEY,
  createImprovementRecommendations,
  createPublishReadyExport,
  createSandboxPerformance,
  getExportForCandidate,
  getImprovementsForPerformance,
  getPerformanceForExport,
  loadPublishImprovementWorkspace,
  saveEntityToPublishImprovementWorkspace,
  writePublishImprovementWorkspace,
} from "./publishImprovementService.js";

const STORAGE_KEYS = [
  REVIEW_DECISION_STORAGE_KEY,
  REVISION_CANDIDATE_STORAGE_KEY,
  PUBLISH_READY_EXPORT_STORAGE_KEY,
  SANDBOX_PERFORMANCE_STORAGE_KEY,
  IMPROVEMENT_RECOMMENDATION_STORAGE_KEY,
];

function getOriginals(storage) {
  return STORAGE_KEYS.map((key) => [key, storage?.getItem?.(key) ?? null]);
}

function rollback(storage, originals) {
  if (!storage || typeof storage.setItem !== "function" || typeof storage.removeItem !== "function") return;
  for (const [key, original] of originals) {
    if (original === null || original === undefined) storage.removeItem(key);
    else storage.setItem(key, original);
  }
}

function safeError(code, field, message) {
  return { code, field, message };
}

export function loadPublishImprovementState(storage, reviewCandidate) {
  const decisions = loadReviewDecisions(storage);
  const revisions = loadRevisionCandidates(storage);
  const exports = loadPublishImprovementWorkspace(storage, PUBLISH_READY_EXPORT_STORAGE_KEY);
  const performance = loadPublishImprovementWorkspace(storage, SANDBOX_PERFORMANCE_STORAGE_KEY);
  const improvements = loadPublishImprovementWorkspace(storage, IMPROVEMENT_RECOMMENDATION_STORAGE_KEY);
  const loaded = [decisions, revisions, exports, performance, improvements];
  const errors = loaded.flatMap((result) => result.ok ? [] : result.errors);
  if (errors.length) return { ok: false, status: "corrupted", payload: {}, errors };
  const version = getReviewCandidateVersion(reviewCandidate);
  const latestRevision = getLatestRevisionCandidate(revisions.workspace, reviewCandidate?.reviewCandidateId);
  const decision = getReviewDecisionForCandidate(decisions.workspace, reviewCandidate?.reviewCandidateId, version);
  const exportEntity = decision?.decision === "approvedForMockWorkflow"
    ? getExportForCandidate(exports.workspace, reviewCandidate?.reviewCandidateId, latestRevision?.revisionCandidateId || null)
      || Object.values(exports.workspace.publishReadyExportsById || {}).find((item) => item.sourceCandidateId === reviewCandidate?.reviewCandidateId)
      || null
    : null;
  const sandboxPerformance = exportEntity ? getPerformanceForExport(performance.workspace, exportEntity.exportId) : null;
  const improvementRecommendations = sandboxPerformance ? getImprovementsForPerformance(improvements.workspace, sandboxPerformance.performanceId) : [];
  return {
    ok: true,
    status: "ready",
    payload: { decision, latestRevision, exportEntity, sandboxPerformance, improvementRecommendations },
    errors: [],
  };
}

function loadAll(storage) {
  const decisions = loadReviewDecisions(storage);
  const revisions = loadRevisionCandidates(storage);
  const exports = loadPublishImprovementWorkspace(storage, PUBLISH_READY_EXPORT_STORAGE_KEY);
  const performance = loadPublishImprovementWorkspace(storage, SANDBOX_PERFORMANCE_STORAGE_KEY);
  const improvements = loadPublishImprovementWorkspace(storage, IMPROVEMENT_RECOMMENDATION_STORAGE_KEY);
  const errors = [decisions, revisions, exports, performance, improvements].flatMap((result) => result.ok ? [] : result.errors);
  return { ok: errors.length === 0, decisions, revisions, exports, performance, improvements, errors };
}

function writeAll(storage, workspaces, scope) {
  const writers = [
    ["decisions", () => writeReviewDecisionWorkspace(storage, workspaces.decisions)],
    ["revisions", () => writeRevisionWorkspace(storage, workspaces.revisions)],
    ["exports", () => writePublishImprovementWorkspace(storage, PUBLISH_READY_EXPORT_STORAGE_KEY, workspaces.exports)],
    ["performance", () => writePublishImprovementWorkspace(storage, SANDBOX_PERFORMANCE_STORAGE_KEY, workspaces.performance)],
    ["improvements", () => writePublishImprovementWorkspace(storage, IMPROVEMENT_RECOMMENDATION_STORAGE_KEY, workspaces.improvements)],
  ].filter(([key]) => scope.includes(key));
  for (const [, write] of writers) {
    const result = write();
    if (!result.ok) return result;
  }
  return { ok: true, status: "ready", errors: [] };
}

export function runOwnerReviewWorkflow(storage, reviewCandidate, input = {}) {
  if (!reviewCandidate?.reviewCandidateId) {
    return { ok: false, status: "candidate_required", payload: {}, errors: [safeError("REVIEW_CANDIDATE_REQUIRED", "reviewCandidateId", "Review Candidate is required.")] };
  }
  const loaded = loadAll(storage);
  if (!loaded.ok) return { ok: false, status: "corrupted", payload: {}, errors: loaded.errors };
  const originals = getOriginals(storage);
  const reviewCandidateVersion = input.reviewCandidateVersion || reviewCandidate.reviewCandidateVersion || reviewCandidate.contentBriefId || "v1";
  const existingDecision = getReviewDecisionForCandidate(loaded.decisions.workspace, reviewCandidate.reviewCandidateId, reviewCandidateVersion);
  const reviewDecision = createReviewDecision(reviewCandidate, input);
  const decisionSave = saveReviewDecisionToWorkspace(loaded.decisions.workspace, reviewDecision);
  if (!decisionSave.ok) return { ok: false, status: decisionSave.status, payload: { reviewDecision }, errors: decisionSave.errors };

  let nextWorkspaces = {
    decisions: decisionSave.workspace,
    revisions: loaded.revisions.workspace,
    exports: loaded.exports.workspace,
    performance: loaded.performance.workspace,
    improvements: loaded.improvements.workspace,
  };
  const payload = { reviewDecision };
  const writeScope = ["decisions"];

  if (reviewDecision.decision === "revisionRequested") {
    const existingRevision = getLatestRevisionCandidate(nextWorkspaces.revisions, reviewCandidate.reviewCandidateId);
    if (
      existingDecision?.decision === "revisionRequested"
      && existingDecision.reasonCode === reviewDecision.reasonCode
      && existingRevision?.revisionReasonCode === reviewDecision.reasonCode
    ) {
      payload.revisionCandidate = existingRevision;
      return { ok: true, status: reviewDecision.decision, payload, errors: [] };
    }
    const revision = createRevisionCandidate(reviewCandidate, reviewDecision, nextWorkspaces.revisions);
    if (!revision.ok) return { ok: false, status: revision.status, payload, errors: revision.errors };
    const revisionSave = saveRevisionCandidateToWorkspace(nextWorkspaces.revisions, revision.revisionCandidate);
    if (!revisionSave.ok) return { ok: false, status: revisionSave.status, payload: { ...payload, revisionCandidate: revision.revisionCandidate }, errors: revisionSave.errors };
    nextWorkspaces = { ...nextWorkspaces, revisions: revisionSave.workspace };
    payload.revisionCandidate = revision.revisionCandidate;
    writeScope.push("revisions");
  }

  if (reviewDecision.decision === "approvedForMockWorkflow") {
    const latestRevision = getLatestRevisionCandidate(nextWorkspaces.revisions, reviewCandidate.reviewCandidateId);
    const publishReady = createPublishReadyExport(reviewCandidate, reviewDecision, latestRevision, input.decidedAt);
    if (!publishReady.ok) return { ok: false, status: publishReady.status, payload, errors: publishReady.errors };
    const exportSave = saveEntityToPublishImprovementWorkspace(PUBLISH_READY_EXPORT_STORAGE_KEY, nextWorkspaces.exports, publishReady.exportEntity.exportId, publishReady.exportEntity);
    if (!exportSave.ok) return { ok: false, status: exportSave.status, payload: { ...payload, exportEntity: publishReady.exportEntity }, errors: exportSave.errors };
    const sandbox = createSandboxPerformance(publishReady.exportEntity);
    if (!sandbox.ok) return { ok: false, status: sandbox.status, payload, errors: sandbox.errors };
    const performanceSave = saveEntityToPublishImprovementWorkspace(SANDBOX_PERFORMANCE_STORAGE_KEY, nextWorkspaces.performance, sandbox.performance.performanceId, sandbox.performance);
    if (!performanceSave.ok) return { ok: false, status: performanceSave.status, payload: { ...payload, sandboxPerformance: sandbox.performance }, errors: performanceSave.errors };
    const improvements = createImprovementRecommendations(sandbox.performance);
    if (!improvements.ok) return { ok: false, status: improvements.status, payload, errors: improvements.errors };
    let improvementWorkspace = nextWorkspaces.improvements;
    for (const recommendation of improvements.improvements) {
      const improvementSave = saveEntityToPublishImprovementWorkspace(IMPROVEMENT_RECOMMENDATION_STORAGE_KEY, improvementWorkspace, recommendation.improvementId, recommendation);
      if (!improvementSave.ok) return { ok: false, status: improvementSave.status, payload: { ...payload, improvementRecommendations: improvements.improvements }, errors: improvementSave.errors };
      improvementWorkspace = improvementSave.workspace;
    }
    nextWorkspaces = {
      ...nextWorkspaces,
      exports: exportSave.workspace,
      performance: performanceSave.workspace,
      improvements: improvementWorkspace,
    };
    payload.exportEntity = publishReady.exportEntity;
    payload.sandboxPerformance = sandbox.performance;
    payload.improvementRecommendations = improvements.improvements;
    writeScope.push("exports", "performance", "improvements");
  }

  const write = writeAll(storage, nextWorkspaces, writeScope);
  if (!write.ok) {
    rollback(storage, originals);
    return { ok: false, status: "save_failed", payload: {}, errors: write.errors };
  }

  return { ok: true, status: reviewDecision.decision, payload, errors: [] };
}
