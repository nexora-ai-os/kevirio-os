export const TRUTH_CLASSES = Object.freeze(["Actual", "Forecast", "Inference", "Unknown", "Mock", "Test"]);
export const PRODUCTION_TRUTH_CLASSES = Object.freeze(["Actual", "Forecast", "Inference", "Unknown"]);
export const COMPLIANCE_STATES = Object.freeze(["PASS", "REVIEW_REQUIRED", "BLOCKED", "UNKNOWN"]);
export const ALERT_SEVERITIES = Object.freeze(["Critical", "High", "Medium", "Low", "Info"]);

export const AFFILIATE_LIFECYCLE = Object.freeze([
  "offer_registered", "affiliate_draft", "research_required", "compliance_review",
  "strategy_draft", "content_planning", "owner_approval", "manual_execution_ready",
  "manual_execution_completed", "evidence_pending", "evidence_verified", "actuals_pending",
  "learning_review", "monitoring", "archived",
]);

export const CONTENT_LIFECYCLE = Object.freeze([
  "idea", "researched", "draft", "compliance_review", "owner_approval",
  "manual_publication_ready", "published", "evidence_pending", "measured", "learning_complete",
]);

export const EXPERIMENT_LIFECYCLE = Object.freeze([
  "hypothesis", "designed", "owner_approved", "manual_execution", "measuring",
  "completed", "inconclusive", "cancelled",
]);

export const AI_EMPLOYEE_REGISTRY = Object.freeze([
  "Affiliate Strategist", "Market Researcher", "SEO Analyst", "Content Strategist",
  "Copywriter", "SNS Planner", "Video Script Writer", "Compliance Reviewer",
  "Evidence Auditor", "Revenue Analyst", "Cost Analyst", "Learning Analyst", "Quality Reviewer",
].map((role) => Object.freeze({
  role,
  permission: "local_draft_only",
  externalExecution: false,
  maxRetries: 1,
  meetingRounds: 1,
  requiredMetadata: ["promptVersion", "promptHash", "model", "temperature", "latency", "cost"],
})));

const lifecycleMap = new Map([
  ["affiliate", AFFILIATE_LIFECYCLE], ["content", CONTENT_LIFECYCLE], ["experiment", EXPERIMENT_LIFECYCLE],
]);
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, finite(value)));
const text = (value) => String(value ?? "").trim();

export function transitionLifecycle(kind, current, next) {
  const states = lifecycleMap.get(kind);
  if (!states) return { ok: false, code: "LIFECYCLE_UNKNOWN" };
  const from = states.indexOf(current);
  const to = states.indexOf(next);
  if (from < 0 || to < 0) return { ok: false, code: "STATE_UNKNOWN" };
  if (to !== from + 1 && !(kind === "experiment" && next === "cancelled")) return { ok: false, code: "TRANSITION_DENIED" };
  return { ok: true, state: next };
}

export function validateTruthValue(value, { production = true } = {}) {
  const truthClass = value?.truthClass;
  const errors = [];
  if (!TRUTH_CLASSES.includes(truthClass)) errors.push("TRUTH_CLASS_INVALID");
  if (production && ["Mock", "Test"].includes(truthClass)) errors.push("NON_PRODUCTION_TRUTH_HIDDEN");
  if (["Forecast", "Inference"].includes(truthClass)) {
    for (const key of ["generatedAt", "sourceData", "assumptions", "confidence", "modelVersion"])
      if (value?.[key] == null || value[key] === "") errors.push(`TRUTH_${key.toUpperCase()}_REQUIRED`);
  }
  if (truthClass === "Actual") {
    for (const key of ["evidenceReference", "sourceReference", "recordedAt", "recordedBy", "auditEvent"])
      if (!text(value?.[key])) errors.push(`ACTUAL_${key.toUpperCase()}_REQUIRED`);
  }
  return { valid: errors.length === 0, errors };
}

export function scoreAffiliateOpportunity(input = {}) {
  const metrics = {
    profitability: clamp(input.profitability), competition: clamp(input.competition), seoFit: clamp(input.seoFit),
    snsFit: clamp(input.snsFit), contentFit: clamp(input.contentFit), conversionPotential: clamp(input.conversionPotential),
    complianceRisk: clamp(input.complianceRisk), evidenceQuality: clamp(input.evidenceQuality), effort: clamp(input.effort),
    timeToRevenue: clamp(input.timeToRevenue), strategicFit: clamp(input.strategicFit),
  };
  const score = Math.round(
    metrics.profitability * .18 + (100 - metrics.competition) * .08 + metrics.seoFit * .08 + metrics.snsFit * .05 +
    metrics.contentFit * .10 + metrics.conversionPotential * .15 + (100 - metrics.complianceRisk) * .12 +
    metrics.evidenceQuality * .09 + (100 - metrics.effort) * .06 + (100 - metrics.timeToRevenue) * .04 + metrics.strategicFit * .05
  );
  const recommendation = score >= 75 ? "PRIORITIZE" : score >= 55 ? "REVIEW" : score >= 35 ? "HOLD" : "DECLINE";
  return { score, recommendation, truthClass: "Inference", rationale: { weightsVersion: "affiliate-score-v2.0.0", metrics } };
}

export function rankAffiliatePriorities(items = []) {
  return items.map((item) => {
    const result = item.scoreResult || scoreAffiliateOpportunity(item.metrics);
    const blockingPenalty = item.blocked ? 1000 : 0;
    const ownerTimePenalty = Math.min(60, finite(item.ownerMinutes)) * .15;
    const deadlineBoost = item.deadlineDays == null ? 0 : Math.max(0, 30 - finite(item.deadlineDays));
    return { ...item, scoreResult: result, priorityValue: result.score + deadlineBoost - ownerTimePenalty - blockingPenalty };
  }).sort((a, b) => b.priorityValue - a.priorityValue || text(a.id).localeCompare(text(b.id)));
}

const TASK_BLUEPRINTS = Object.freeze([
  ["productProfile", "product_research", "商品情報を確認"], ["market", "market_research", "市場を調査"],
  ["competitors", "competitor_research", "競合を比較"], ["compliance", "compliance_review", "表現・規約を確認"],
  ["audience", "target_analysis", "対象顧客を定義"], ["keywords", "keyword_plan", "キーワードを設計"],
  ["contentPlan", "content_plan", "コンテンツ計画を作成"], ["publication", "manual_publication", "手動公開を準備"],
  ["evidence", "evidence", "Evidenceを登録"], ["revenue", "revenue", "Actual Revenueを確認"],
  ["cost", "cost", "Actual Costを確認"], ["learning", "learning", "Learningを記録"],
]);

export function generateAffiliateTasks(program = {}, existing = []) {
  const existingKeys = new Set(existing.map((task) => task.dedupeKey));
  return TASK_BLUEPRINTS.filter(([field]) => !program[field]).map(([field, type, title]) => ({
    type, title, field, status: "pending", ownerRemovable: true, externalExecution: false,
    dedupeKey: `${text(program.id) || "draft"}:${type}`,
  })).filter((task) => !existingKeys.has(task.dedupeKey));
}

export function evaluateCompliance(input = {}) {
  const source = `${text(input.title)} ${text(input.body)} ${text(input.claims)}`.toLowerCase();
  const findings = [];
  if (!text(input.disclosure)) findings.push({ code: "DISCLOSURE_MISSING", state: "BLOCKED" });
  if (!text(input.claimSource)) findings.push({ code: "SOURCE_MISSING", state: "REVIEW_REQUIRED" });
  if (/guarantee|治る|必ず痩せる|絶対儲かる/.test(source)) findings.push({ code: "UNVERIFIED_CLAIM", state: "BLOCKED" });
  if (/medical|診断|治療|投資助言/.test(source)) findings.push({ code: "REGULATED_CLAIM", state: "REVIEW_REQUIRED" });
  if (input.productModel && input.claimedModel && input.productModel !== input.claimedModel) findings.push({ code: "OLD_MODEL_CONFUSION", state: "BLOCKED" });
  const state = findings.some((f) => f.state === "BLOCKED") ? "BLOCKED" : findings.length ? "REVIEW_REQUIRED" : "PASS";
  return { state, findings, legalConclusion: false };
}

export function detectAffiliateDuplicates(records = []) {
  const seen = new Map();
  const duplicates = [];
  for (const record of records) {
    const normalized = text(record.value).toLocaleLowerCase("ja-JP").replace(/\s+/g, " ");
    if (!normalized) continue;
    const key = `${record.kind}:${normalized}`;
    if (seen.has(key)) duplicates.push({ kind: record.kind, firstId: seen.get(key), duplicateId: record.id, exact: true });
    else seen.set(key, record.id);
  }
  return duplicates;
}

export function aggregateAffiliateKpis({ performance = [], revenue = [], costs = [] } = {}) {
  const clicks = performance.reduce((sum, row) => sum + finite(row.clicks), 0);
  const conversions = performance.reduce((sum, row) => sum + finite(row.conversions), 0);
  const actualRevenue = revenue.filter((row) => row.truth_class === "Actual").reduce((sum, row) => sum + finite(row.amount_minor), 0);
  const actualCost = costs.filter((row) => row.truth_class === "Actual").reduce((sum, row) => sum + finite(row.amount_minor), 0);
  const forecastRevenue = revenue.filter((row) => row.truth_class === "Forecast").reduce((sum, row) => sum + finite(row.amount_minor), 0);
  const netProfit = actualRevenue - actualCost;
  return { clicks, conversions, cvr: clicks ? conversions / clicks : null, actualRevenue, forecastRevenue, actualCost, netProfit,
    roi: actualCost ? netProfit / actualCost : null, epc: clicks ? actualRevenue / clicks : null, truthClass: "Actual" };
}

export function deriveAffiliateAlerts({ compliance = [], publications = [], evidence = [], performance = [] } = {}) {
  const alerts = [];
  compliance.filter((item) => ["BLOCKED", "UNKNOWN"].includes(item.state)).forEach((item) => alerts.push({ severity: "Critical", code: item.code || "COMPLIANCE_BLOCKED", entityId: item.entityId }));
  const evidencePublicationIds = new Set(evidence.map((item) => item.publication_id));
  publications.filter((item) => item.status === "manually_published" && !evidencePublicationIds.has(item.id)).forEach((item) => alerts.push({ severity: "High", code: "EVIDENCE_MISSING", entityId: item.id }));
  performance.filter((item) => finite(item.cvrDropPercent) >= 30).forEach((item) => alerts.push({ severity: "High", code: "CVR_DROP", entityId: item.id }));
  const order = new Map(ALERT_SEVERITIES.map((severity, index) => [severity, index]));
  return alerts.sort((a, b) => order.get(a.severity) - order.get(b.severity));
}

export function buildOwnerDailyBrief(input = {}) {
  const ranked = rankAffiliatePriorities(input.opportunities || []);
  const alerts = deriveAffiliateAlerts(input);
  const decisions = (input.decisions || []).filter((item) => item.status === "pending").slice(0, 3);
  const actions = ranked.filter((item) => !item.blocked).slice(0, 3).map((item) => ({ id: item.id, title: item.title, reason: item.reason, expectedOutcome: item.expectedOutcome,
    ownerMinutes: finite(item.ownerMinutes), risk: item.risk || "Unknown", requiredOwnerAction: item.requiredOwnerAction || "確認", confidence: item.confidence ?? null }));
  return { generatedAt: input.generatedAt || new Date().toISOString(), actions, decisions, alerts: alerts.slice(0, 5), blocked: ranked.filter((item) => item.blocked),
    kpis: aggregateAffiliateKpis(input), externalExecution: "LOCKED", ruleVersion: "affiliate-daily-brief-v2.0.0" };
}

export function buildIntelligenceGraph(offer, relations = {}) {
  if (!offer?.id) return { nodes: [], edges: [] };
  const nodes = [{ id: `offer:${offer.id}`, type: "Offer", label: offer.title || "Offer", truthClass: offer.truthClass || "Unknown" }];
  const edges = [];
  Object.entries(relations).forEach(([type, values]) => (values || []).forEach((value) => {
    const id = `${type}:${value.id}`;
    nodes.push({ id, type, label: value.title || value.name || type, truthClass: value.truthClass || "Unknown" });
    edges.push({ from: `offer:${offer.id}`, to: id, relation: value.relation || "references" });
  }));
  return { nodes, edges };
}

export function validateAiExecution(input = {}) {
  const errors = [];
  if (!AI_EMPLOYEE_REGISTRY.some((employee) => employee.role === input.role)) errors.push("AI_EMPLOYEE_UNREGISTERED");
  if (finite(input.retryCount) > 1) errors.push("AI_RETRY_LIMIT_EXCEEDED");
  if (finite(input.meetingRounds) > 1) errors.push("AI_MEETING_ROUND_LIMIT_EXCEEDED");
  if (input.externalExecution !== false) errors.push("EXTERNAL_EXECUTION_LOCKED");
  for (const key of ["promptVersion", "promptHash", "model", "temperature"])
    if (input[key] == null || input[key] === "") errors.push(`AI_${key.toUpperCase()}_REQUIRED`);
  return { valid: errors.length === 0, errors };
}

export function marketplaceAsset(candidate = {}) {
  return { ...candidate, maturity: candidate.maturity || "internal", ownership: candidate.ownership || "Unknown",
    version: candidate.version || "1.0.0", licenseClassification: candidate.licenseClassification || "internal_only",
    internalReuse: candidate.internalReuse !== false, exportReady: false, publicMarketplace: false, paymentEnabled: false };
}
