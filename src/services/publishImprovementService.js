import { DATA_MODES, MARKET_INTELLIGENCE_SCHEMA_VERSION } from "../data/marketIntelligenceSchemas.js";
import { createDeterministicId } from "./marketIntelligenceEngine.js";

export const PUBLISH_READY_EXPORT_STORAGE_KEY = "kevirio:publish-ready-exports:v2";
export const SANDBOX_PERFORMANCE_STORAGE_KEY = "kevirio:sandbox-performance:v2";
export const IMPROVEMENT_RECOMMENDATION_STORAGE_KEY = "kevirio:improvement-recommendations:v2";

export const PUBLISH_READY_EXPORTS_COLLECTION = "publishReadyExportsById";
export const SANDBOX_PERFORMANCE_COLLECTION = "sandboxPerformanceById";
export const IMPROVEMENT_RECOMMENDATIONS_COLLECTION = "improvementRecommendationsById";

const MAX_WORKSPACE_ITEMS = 50;

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function emptyWorkspace(collectionName) {
  return {
    schemaVersion: MARKET_INTELLIGENCE_SCHEMA_VERSION,
    dataMode: DATA_MODES.MOCK,
    isMock: true,
    workspaceOnly: true,
    [collectionName]: {},
  };
}

function stableNumber(input) {
  const text = String(input || "");
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function safeText(value, fallback) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function sourceFrom(reviewCandidate, revisionCandidate) {
  const campaign = revisionCandidate?.revisedCampaign || reviewCandidate?.campaignSummary || {};
  const brief = revisionCandidate?.revisedContentBrief || reviewCandidate?.contentBriefPreview || {};
  return {
    title: safeText(campaign.title || reviewCandidate?.title || brief.workingTitle, "Market由来Mock成果物"),
    targetAudience: safeText(campaign.targetAudience || brief.targetAudience, "対象者"),
    channel: safeText(campaign.channel || campaign.primaryChannel, "Sandbox"),
    offerConcept: safeText(campaign.offerConcept, "Mock提案"),
    objective: safeText(campaign.objective, "Mock成果物を安全に公開準備へ進める"),
    contentBrief: safeText(brief.workingTitle, "Content Brief"),
    finalDraft: safeText(revisionCandidate?.revisedDraftPreview || reviewCandidate?.contentBriefPreview?.draftPreview, "Mock Draft"),
    riskNotes: brief.riskNotes || reviewCandidate?.contentBriefPreview?.riskNotes || [],
    prohibitedClaims: brief.prohibitedClaims || reviewCandidate?.contentBriefPreview?.prohibitedClaims || [],
    forecastRevenueRange: campaign.forecastRevenueRange || reviewCandidate?.campaignSummary?.forecastRevenueRange || null,
  };
}

function getExportId(sourceCandidateId, sourceRevisionCandidateId, reviewDecisionId) {
  return createDeterministicId("publish-ready-export", {
    sourceCandidateId,
    sourceRevisionCandidateId: sourceRevisionCandidateId || "base",
    reviewDecisionId,
    dataMode: DATA_MODES.MOCK,
  }).id;
}

function getPerformanceId(exportId) {
  return createDeterministicId("sandbox-performance", { exportId, dataMode: DATA_MODES.MOCK }).id;
}

function getImprovementId(performanceId, priority) {
  return createDeterministicId("improvement-recommendation", { performanceId, priority, dataMode: DATA_MODES.MOCK }).id;
}

export function buildExportMarkdown(exportEntity) {
  return [
    `# ${exportEntity.title}`,
    "",
    `- Channel: ${exportEntity.channel}`,
    `- Status: Publish-ready Mock`,
    `- Campaign: ${exportEntity.campaignSummary}`,
    `- CTA: ${exportEntity.callToAction}`,
    "",
    "## Content Brief",
    exportEntity.contentBrief,
    "",
    "## Final Draft",
    exportEntity.finalDraft,
    "",
    "## Safety",
    "- Production公開なし",
    "- 外部送信なし",
    "- 実売上未接続",
    `- 禁止表現: ${exportEntity.prohibitedClaims.join(" / ") || "なし"}`,
  ].join("\n");
}

export function createPublishReadyExport(reviewCandidate, reviewDecision, revisionCandidate = null, createdAt = "2026-07-16T00:00:00.000Z") {
  if (reviewDecision?.decision !== "approvedForMockWorkflow") {
    return { ok: false, status: "decision_not_approved", exportEntity: null, errors: [{ code: "APPROVED_FOR_MOCK_WORKFLOW_REQUIRED", field: "decision", message: "Publish-ready export requires approvedForMockWorkflow." }] };
  }
  const source = sourceFrom(reviewCandidate, revisionCandidate);
  const exportEntity = {
    exportId: getExportId(reviewCandidate?.reviewCandidateId, revisionCandidate?.revisionCandidateId || null, reviewDecision.reviewDecisionId),
    sourceCandidateId: reviewCandidate?.reviewCandidateId,
    sourceRevisionCandidateId: revisionCandidate?.revisionCandidateId || null,
    reviewDecisionId: reviewDecision.reviewDecisionId,
    correlationId: reviewCandidate?.correlationId,
    schemaVersion: MARKET_INTELLIGENCE_SCHEMA_VERSION,
    dataMode: DATA_MODES.MOCK,
    isMock: true,
    title: source.title,
    contentType: "mockCampaignDraft",
    channel: source.channel,
    campaignSummary: `${source.objective} / ${source.offerConcept}`,
    contentBrief: source.contentBrief,
    finalDraft: source.finalDraft,
    callToAction: "Owner確認後、次Sprintで改善案の採用可否を判断",
    riskNotes: Array.from(new Set([...source.riskNotes, "Publish-readyはMock準備状態です。"])),
    prohibitedClaims: source.prohibitedClaims,
    assumptions: ["Sandbox Mockのみ", "外部SNS/CMS/APIへ送信しない", "実売上・Ledgerへ接続しない"],
    exportFormat: "markdown",
    status: "publishReadyMock",
    productionExecution: false,
    externalExecution: false,
    approvalConfirmed: false,
    publishEnabled: false,
    ledgerAppend: false,
    actualRevenueConnected: false,
    createdAt,
  };
  exportEntity.markdown = buildExportMarkdown(exportEntity);
  const validation = validatePublishReadyExport(exportEntity);
  return validation.valid ? { ok: true, status: "publishReadyMock", exportEntity, errors: [] } : { ok: false, status: "invalid", exportEntity, errors: validation.errors };
}

export function createSandboxPerformance(exportEntity) {
  if (!exportEntity?.exportId) {
    return { ok: false, status: "export_required", performance: null, errors: [{ code: "EXPORT_REQUIRED", field: "exportId", message: "Export is required." }] };
  }
  const seed = stableNumber(exportEntity.exportId);
  const mockImpressions = 180 + (seed % 420);
  const mockClicks = Math.max(1, Math.floor(mockImpressions * (0.035 + ((seed % 11) / 1000))));
  const mockLeads = Math.max(0, Math.floor(mockClicks * (0.08 + ((seed % 5) / 100))));
  const mockConversions = Math.max(0, Math.floor(mockLeads * 0.25));
  const mockCtr = Number((mockClicks / mockImpressions).toFixed(4));
  const mockConversionRate = Number((mockClicks ? mockConversions / mockClicks : 0).toFixed(4));
  const baseEstimate = mockConversions * 18000 + mockLeads * 2400;
  const performance = {
    performanceId: getPerformanceId(exportEntity.exportId),
    exportId: exportEntity.exportId,
    correlationId: exportEntity.correlationId,
    schemaVersion: MARKET_INTELLIGENCE_SCHEMA_VERSION,
    dataMode: DATA_MODES.MOCK,
    isMock: true,
    simulationWindowDays: 30,
    mockImpressions,
    mockClicks,
    mockLeads,
    mockConversions,
    mockCtr,
    mockConversionRate,
    forecastRevenueRange: null,
    mockRevenueEstimate: {
      currency: "JPY",
      low: Math.max(0, Math.round(baseEstimate * 0.55)),
      base: Math.max(0, baseEstimate),
      high: Math.max(0, Math.round(baseEstimate * 1.35)),
      periodDays: 30,
      assumptions: ["Sandbox内の模擬反応", "外部Analytics未接続", "実売上ではありません"],
      confidence: 55,
      isMock: true,
    },
    assumptions: ["同一Exportから同一結果", "Math.random不使用", "実行時刻で数値を変えない"],
    warnings: ["Sandbox模擬結果です。実績ではありません。", "外部Analytics未接続です。"],
    status: "simulationComplete",
    actualRevenueConnected: false,
    productionExecution: false,
    externalExecution: false,
    ledgerAppend: false,
    approvalConfirmed: false,
    publishEnabled: false,
  };
  const validation = validateSandboxPerformance(performance);
  return validation.valid ? { ok: true, status: "simulationComplete", performance, errors: [] } : { ok: false, status: "invalid", performance, errors: validation.errors };
}

export function createImprovementRecommendations(performance) {
  if (!performance?.performanceId) {
    return { ok: false, status: "performance_required", improvements: [], errors: [{ code: "PERFORMANCE_REQUIRED", field: "performanceId", message: "Performance is required." }] };
  }
  const templates = [
    {
      priority: 1,
      finding: performance.mockCtr < 0.045 ? "クリック率の伸びしろがあります" : "初期反応は確認できます",
      recommendedChange: performance.mockCtr < 0.045 ? "冒頭の課題提示を短くし、CTAを1つに絞る" : "反応のあった訴求を維持し、次は対象者別に比較する",
      expectedImpact: performance.mockCtr < 0.045 ? "Mock CTRの改善余地" : "安定したLead獲得の検証",
      confidence: 62,
      nextAction: "次Sprintで改善案を採用するか判断",
    },
    {
      priority: 2,
      finding: "Leadへの導線がまだ弱い可能性",
      recommendedChange: "無料診断または相談フォームへの一文を追加",
      expectedImpact: "Mock Lead率の改善",
      confidence: 58,
      nextAction: "CTA文面を1案だけ再生成",
    },
    {
      priority: 3,
      finding: "安全表現は維持されています",
      recommendedChange: "成果保証に見える表現を引き続き避ける",
      expectedImpact: "公開準備時のリスク低減",
      confidence: 70,
      nextAction: "Legal確認Candidateへ渡す準備",
    },
  ];
  const improvements = templates.map((item) => ({
    improvementId: getImprovementId(performance.performanceId, item.priority),
    performanceId: performance.performanceId,
    exportId: performance.exportId,
    correlationId: performance.correlationId,
    schemaVersion: MARKET_INTELLIGENCE_SCHEMA_VERSION,
    dataMode: DATA_MODES.MOCK,
    isMock: true,
    priority: item.priority,
    finding: item.finding,
    recommendedChange: item.recommendedChange,
    expectedImpact: item.expectedImpact,
    confidence: item.confidence,
    nextAction: item.nextAction,
    status: "recommendationReady",
    autoApplyEnabled: false,
    productionExecution: false,
    externalExecution: false,
    approvalConfirmed: false,
    ledgerAppend: false,
    publishEnabled: false,
    actualRevenueConnected: false,
  }));
  const errors = improvements.flatMap((improvement) => validateImprovementRecommendation(improvement).errors);
  return errors.length ? { ok: false, status: "invalid", improvements, errors } : { ok: true, status: "recommendationReady", improvements, errors: [] };
}

function validateCommon(entity, idField) {
  const errors = [];
  if (!isPlainObject(entity)) return [{ code: "ENTITY_INVALID", field: idField, message: "Entity must be an object." }];
  if (!entity[idField]) errors.push({ code: "ID_REQUIRED", field: idField, message: `${idField} is required.` });
  if (entity.schemaVersion !== MARKET_INTELLIGENCE_SCHEMA_VERSION) errors.push({ code: "SCHEMA_VERSION_MISMATCH", field: "schemaVersion", message: "schemaVersion mismatch." });
  if (entity.dataMode !== DATA_MODES.MOCK) errors.push({ code: "REAL_DATA_NOT_ALLOWED", field: "dataMode", message: "Only mock is allowed." });
  if (entity.isMock !== true) errors.push({ code: "MOCK_REQUIRED", field: "isMock", message: "isMock must be true." });
  if (entity.productionExecution !== false) errors.push({ code: "PRODUCTION_FORBIDDEN", field: "productionExecution", message: "productionExecution must be false." });
  if (entity.externalExecution !== false) errors.push({ code: "EXTERNAL_FORBIDDEN", field: "externalExecution", message: "externalExecution must be false." });
  if (entity.approvalConfirmed !== false) errors.push({ code: "APPROVAL_FORBIDDEN", field: "approvalConfirmed", message: "approvalConfirmed must be false." });
  if (entity.publishEnabled !== false) errors.push({ code: "PUBLISH_FORBIDDEN", field: "publishEnabled", message: "publishEnabled must be false." });
  if (entity.ledgerAppend !== false) errors.push({ code: "LEDGER_FORBIDDEN", field: "ledgerAppend", message: "ledgerAppend must be false." });
  if (entity.actualRevenueConnected !== false) errors.push({ code: "ACTUAL_REVENUE_FORBIDDEN", field: "actualRevenueConnected", message: "actualRevenueConnected must be false." });
  return errors;
}

export function validatePublishReadyExport(exportEntity) {
  const errors = validateCommon(exportEntity, "exportId");
  for (const field of ["sourceCandidateId", "reviewDecisionId", "correlationId", "title", "contentType", "channel", "campaignSummary", "contentBrief", "finalDraft", "callToAction", "exportFormat", "status", "createdAt", "markdown"]) {
    if (exportEntity?.[field] === undefined || exportEntity?.[field] === null || exportEntity?.[field] === "") errors.push({ code: "REQUIRED_FIELD_MISSING", field, message: `${field} is required.` });
  }
  if (exportEntity?.status !== "publishReadyMock") errors.push({ code: "STATUS_INVALID", field: "status", message: "status must be publishReadyMock." });
  if (exportEntity?.exportFormat !== "markdown") errors.push({ code: "FORMAT_INVALID", field: "exportFormat", message: "Only markdown is allowed." });
  if (!Array.isArray(exportEntity?.prohibitedClaims) || !Array.isArray(exportEntity?.assumptions)) errors.push({ code: "ARRAY_REQUIRED", field: "prohibitedClaims", message: "Arrays are required." });
  if (exportEntity?.exportId !== getExportId(exportEntity?.sourceCandidateId, exportEntity?.sourceRevisionCandidateId || null, exportEntity?.reviewDecisionId)) {
    errors.push({ code: "EXPORT_ID_MISMATCH", field: "exportId", message: "exportId must be deterministic." });
  }
  return { valid: errors.length === 0, errors };
}

export function validateSandboxPerformance(performance) {
  const errors = validateCommon(performance, "performanceId");
  for (const field of ["exportId", "correlationId", "simulationWindowDays", "mockImpressions", "mockClicks", "mockLeads", "mockConversions", "mockCtr", "mockConversionRate", "mockRevenueEstimate", "status"]) {
    if (performance?.[field] === undefined || performance?.[field] === null || performance?.[field] === "") errors.push({ code: "REQUIRED_FIELD_MISSING", field, message: `${field} is required.` });
  }
  if (performance?.status !== "simulationComplete") errors.push({ code: "STATUS_INVALID", field: "status", message: "status must be simulationComplete." });
  if ([performance?.mockImpressions, performance?.mockClicks, performance?.mockLeads, performance?.mockConversions].some((value) => !Number.isFinite(value) || value < 0)) {
    errors.push({ code: "MOCK_METRIC_INVALID", field: "mockMetrics", message: "Mock metrics must be non-negative numbers." });
  }
  if (performance?.mockCtr < 0 || performance?.mockCtr > 1 || performance?.mockConversionRate < 0 || performance?.mockConversionRate > 1) {
    errors.push({ code: "RATE_INVALID", field: "mockRates", message: "Rates must be 0 to 1." });
  }
  if (!isPlainObject(performance?.mockRevenueEstimate) || performance.mockRevenueEstimate.isMock !== true) {
    errors.push({ code: "MOCK_ESTIMATE_REQUIRED", field: "mockRevenueEstimate", message: "Mock estimate is required." });
  }
  if (performance?.performanceId !== getPerformanceId(performance?.exportId)) {
    errors.push({ code: "PERFORMANCE_ID_MISMATCH", field: "performanceId", message: "performanceId must be deterministic." });
  }
  return { valid: errors.length === 0, errors };
}

export function validateImprovementRecommendation(improvement) {
  const errors = validateCommon(improvement, "improvementId");
  for (const field of ["performanceId", "exportId", "correlationId", "priority", "finding", "recommendedChange", "expectedImpact", "confidence", "nextAction", "status"]) {
    if (improvement?.[field] === undefined || improvement?.[field] === null || improvement?.[field] === "") errors.push({ code: "REQUIRED_FIELD_MISSING", field, message: `${field} is required.` });
  }
  if (improvement?.status !== "recommendationReady") errors.push({ code: "STATUS_INVALID", field: "status", message: "status must be recommendationReady." });
  if (improvement?.autoApplyEnabled !== false) errors.push({ code: "AUTO_APPLY_FORBIDDEN", field: "autoApplyEnabled", message: "autoApplyEnabled must be false." });
  if (!Number.isInteger(improvement?.priority) || improvement.priority < 1 || improvement.priority > 3) errors.push({ code: "PRIORITY_INVALID", field: "priority", message: "priority must be 1 to 3." });
  if (improvement?.improvementId !== getImprovementId(improvement?.performanceId, improvement?.priority)) {
    errors.push({ code: "IMPROVEMENT_ID_MISMATCH", field: "improvementId", message: "improvementId must be deterministic." });
  }
  return { valid: errors.length === 0, errors };
}

const STORAGE_META = Object.freeze({
  [PUBLISH_READY_EXPORT_STORAGE_KEY]: {
    collection: PUBLISH_READY_EXPORTS_COLLECTION,
    validator: validatePublishReadyExport,
  },
  [SANDBOX_PERFORMANCE_STORAGE_KEY]: {
    collection: SANDBOX_PERFORMANCE_COLLECTION,
    validator: validateSandboxPerformance,
  },
  [IMPROVEMENT_RECOMMENDATION_STORAGE_KEY]: {
    collection: IMPROVEMENT_RECOMMENDATIONS_COLLECTION,
    validator: validateImprovementRecommendation,
  },
});

export function validatePublishImprovementWorkspace(storageKey, workspace) {
  const meta = STORAGE_META[storageKey];
  const errors = [];
  if (!isPlainObject(workspace)) return [{ code: "WORKSPACE_INVALID", field: storageKey, message: "Workspace must be an object." }];
  if (workspace.schemaVersion !== MARKET_INTELLIGENCE_SCHEMA_VERSION) errors.push({ code: "SCHEMA_VERSION_MISMATCH", field: "schemaVersion", message: "schemaVersion mismatch." });
  if (workspace.dataMode !== DATA_MODES.MOCK) errors.push({ code: "REAL_DATA_NOT_ALLOWED", field: "dataMode", message: "Only mock is allowed." });
  if (workspace.isMock !== true) errors.push({ code: "MOCK_REQUIRED", field: "isMock", message: "isMock must be true." });
  if (workspace.workspaceOnly !== true) errors.push({ code: "WORKSPACE_ONLY_REQUIRED", field: "workspaceOnly", message: "workspaceOnly must be true." });
  if (!isPlainObject(workspace[meta.collection])) errors.push({ code: "COLLECTION_INVALID", field: meta.collection, message: "Collection must be an object." });
  if (errors.length) return errors;
  for (const [key, entity] of Object.entries(workspace[meta.collection])) {
    const validation = meta.validator(entity);
    errors.push(...validation.errors.map((error) => ({ ...error, field: `${meta.collection}.${key}.${error.field}` })));
  }
  return errors;
}

export function loadPublishImprovementWorkspace(storage, storageKey) {
  const meta = STORAGE_META[storageKey];
  if (!meta) return { ok: false, status: "unknown_key", workspace: {}, errors: [{ code: "UNKNOWN_STORAGE_KEY", field: storageKey, message: "Unknown storage key." }] };
  if (!storage || typeof storage.getItem !== "function") return { ok: true, status: "empty", workspace: emptyWorkspace(meta.collection), errors: [] };
  let raw;
  try {
    raw = storage.getItem(storageKey);
  } catch (error) {
    return { ok: false, status: "read_failed", workspace: emptyWorkspace(meta.collection), errors: [{ code: "STORAGE_READ_FAILED", field: storageKey, message: error?.message || "Storage read failed." }] };
  }
  if (!raw) return { ok: true, status: "empty", workspace: emptyWorkspace(meta.collection), errors: [] };
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, status: "corrupted", workspace: emptyWorkspace(meta.collection), errors: [{ code: "JSON_PARSE_FAILED", field: storageKey, message: "Workspace JSON is corrupted." }] };
  }
  const errors = validatePublishImprovementWorkspace(storageKey, parsed);
  return { ok: errors.length === 0, status: errors.length ? "corrupted" : "ready", workspace: errors.length ? emptyWorkspace(meta.collection) : parsed, errors };
}

export function saveEntityToPublishImprovementWorkspace(storageKey, workspace, entityId, entity) {
  const meta = STORAGE_META[storageKey];
  const validation = meta.validator(entity);
  if (!validation.valid) return { ok: false, status: "invalid", workspace, errors: validation.errors };
  const collection = workspace?.[meta.collection] || {};
  if (!collection[entityId] && Object.keys(collection).length >= MAX_WORKSPACE_ITEMS) {
    return { ok: false, status: "limit_exceeded", workspace, errors: [{ code: "WORKSPACE_LIMIT_EXCEEDED", field: storageKey, message: "Workspace keeps at most 50 items." }] };
  }
  return {
    ok: true,
    status: "ready",
    workspace: {
      ...workspace,
      [meta.collection]: {
        ...collection,
        [entityId]: entity,
      },
    },
    errors: [],
  };
}

export function writePublishImprovementWorkspace(storage, storageKey, workspace) {
  const errors = validatePublishImprovementWorkspace(storageKey, workspace);
  if (errors.length) return { ok: false, status: "invalid", errors };
  try {
    storage.setItem(storageKey, JSON.stringify(workspace));
    return { ok: true, status: "ready", errors: [] };
  } catch (error) {
    return { ok: false, status: "save_failed", errors: [{ code: "STORAGE_WRITE_FAILED", field: storageKey, message: error?.message || "Storage write failed." }] };
  }
}

export function getExportForCandidate(workspace, sourceCandidateId, sourceRevisionCandidateId = null) {
  return Object.values(workspace?.[PUBLISH_READY_EXPORTS_COLLECTION] || {}).find((item) => (
    item.sourceCandidateId === sourceCandidateId && (item.sourceRevisionCandidateId || null) === (sourceRevisionCandidateId || null)
  )) || null;
}

export function getPerformanceForExport(workspace, exportId) {
  return Object.values(workspace?.[SANDBOX_PERFORMANCE_COLLECTION] || {}).find((item) => item.exportId === exportId) || null;
}

export function getImprovementsForPerformance(workspace, performanceId) {
  return Object.values(workspace?.[IMPROVEMENT_RECOMMENDATIONS_COLLECTION] || {})
    .filter((item) => item.performanceId === performanceId)
    .sort((a, b) => Number(a.priority) - Number(b.priority));
}
