import {
  ASSET_LANE_WEIGHTS,
  CASH_LANE_WEIGHTS,
  DATA_MODES,
  FORBIDDEN_REVENUE_FIELDS,
  GATE_REASON_CODES,
  GATE_RESULTS,
  LANES,
  MARKET_INTELLIGENCE_SCHEMA_VERSION,
  OPPORTUNITY_STATES,
  PENALTY_VALUES,
  SCORE_FIELDS,
  SOURCE_TIERS,
  SOURCE_TIER_ADJUSTMENTS,
  SOURCE_TYPES,
  THRESHOLDS,
} from "../data/marketIntelligenceSchemas.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const UNORDERED_ARRAY_KEYS = new Set([
  "keywords",
  "monetizationEvidence",
  "riskFlags",
  "signalIds",
  "sourceNames",
  "supportingSignalIds",
]);

export function clamp(value, min = 0, max = 100) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, number));
}

export function roundTo1Decimal(value) {
  return Math.round(Number(value) * 10) / 10;
}

export function canonicalize(value, path = [], seen = new WeakSet()) {
  if (value === undefined) {
    throw new Error("CANONICAL_UNDEFINED");
  }
  if (typeof value === "bigint") {
    throw new Error("CANONICAL_BIGINT");
  }
  if (value instanceof Date) {
    throw new Error("CANONICAL_DATE");
  }
  if (value === null || typeof value === "number" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "string") {
    return JSON.stringify(value.trim());
  }
  if (Array.isArray(value)) {
    const normalized = value.map((entry) => canonicalize(entry, path, seen));
    const currentKey = path[path.length - 1];
    const ordered = UNORDERED_ARRAY_KEYS.has(currentKey) ? normalized.sort() : normalized;
    return `[${ordered.join(",")}]`;
  }
  if (typeof value === "object") {
    if (seen.has(value)) {
      throw new Error("CANONICAL_CYCLE");
    }
    seen.add(value);
    const keys = Object.keys(value).sort();
    const pairs = keys.map((key) => `${JSON.stringify(key)}:${canonicalize(value[key], [...path, key], seen)}`);
    seen.delete(value);
    return `{${pairs.join(",")}}`;
  }
  throw new Error("CANONICAL_UNSUPPORTED");
}

export function normalizeIdentifier(value) {
  return String(value || "").trim().toLowerCase();
}

export function fnv1a64(input) {
  const bytes = new TextEncoder().encode(input);
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  const mask = 0xffffffffffffffffn;

  for (const byte of bytes) {
    hash ^= BigInt(byte);
    hash = (hash * prime) & mask;
  }

  return hash.toString(16).padStart(16, "0");
}

export function createDeterministicId(entityType, material) {
  const canonical = canonicalize({
    schemaVersion: MARKET_INTELLIGENCE_SCHEMA_VERSION,
    entityType: normalizeIdentifier(entityType),
    ...material,
  });
  return {
    id: `mi:${normalizeIdentifier(entityType)}:${fnv1a64(canonical)}`,
    canonical,
  };
}

export function detectIdCollisions(items = []) {
  const seen = new Map();
  const collisions = [];

  for (const item of items) {
    if (!item.id || !item.canonical) continue;
    const existing = seen.get(item.id);
    if (existing && existing !== item.canonical) {
      collisions.push(item.id);
    } else {
      seen.set(item.id, item.canonical);
    }
  }

  return collisions;
}

function makeError(field, code, message) {
  return { field, code, message };
}

function createValidation() {
  return {
    valid: true,
    result: GATE_RESULTS.PASS,
    reasonCodes: [],
    errors: [],
  };
}

function pushIssue(validation, result, field, code, message) {
  validation.reasonCodes.push(code);
  validation.errors.push(makeError(field, code, message));
  if (result === GATE_RESULTS.REJECT) {
    validation.result = GATE_RESULTS.REJECT;
    validation.valid = false;
  } else if (validation.result !== GATE_RESULTS.REJECT) {
    validation.result = GATE_RESULTS.HOLD;
    validation.valid = false;
  }
}

function mergeValidations(validations) {
  const merged = createValidation();
  for (const validation of validations) {
    for (const error of validation.errors || []) {
      pushIssue(merged, validation.result, error.field, error.code, error.message);
    }
  }
  return merged;
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object || {}, key);
}

function checkForbiddenRevenueFields(entity, validation) {
  for (const field of FORBIDDEN_REVENUE_FIELDS) {
    if (hasOwn(entity, field)) {
      pushIssue(
        validation,
        GATE_RESULTS.REJECT,
        field,
        GATE_REASON_CODES.ACTUAL_REVENUE_DEPENDENCY,
        `${field} is forbidden in Market Intelligence MVP.`
      );
    }
  }
}

function validateMockBoundary(entity, validation) {
  if (entity.schemaVersion !== MARKET_INTELLIGENCE_SCHEMA_VERSION) {
    pushIssue(
      validation,
      GATE_RESULTS.REJECT,
      "schemaVersion",
      GATE_REASON_CODES.SCHEMA_VERSION_MISMATCH,
      "schemaVersion must match the frozen Market Intelligence schema."
    );
  }
  if (entity.dataMode !== DATA_MODES.MOCK) {
    pushIssue(
      validation,
      GATE_RESULTS.REJECT,
      "dataMode",
      GATE_REASON_CODES.REAL_DATA_NOT_ALLOWED,
      "Only mock dataMode is allowed in P0-013A."
    );
  }
  if (entity.isMock !== true) {
    pushIssue(
      validation,
      GATE_RESULTS.REJECT,
      "isMock",
      GATE_REASON_CODES.MOCK_FLAG_REQUIRED,
      "isMock must be true in P0-013A."
    );
  }
  if (entity.productionExecution === true || entity.production === true || entity.mode === "production") {
    pushIssue(
      validation,
      GATE_RESULTS.REJECT,
      "productionExecution",
      GATE_REASON_CODES.PRODUCTION_NOT_ALLOWED,
      "Production execution is not allowed."
    );
  }
  if (entity.externalExecution === true || entity.isExternalRequest === true || entity.externalCommunication === true) {
    pushIssue(
      validation,
      GATE_RESULTS.REJECT,
      "externalExecution",
      GATE_REASON_CODES.EXTERNAL_EXECUTION_NOT_ALLOWED,
      "External execution is not allowed."
    );
  }
  checkForbiddenRevenueFields(entity, validation);
}

function requireEvaluationTime(evaluationTime) {
  const value = Number(evaluationTime);
  if (!Number.isFinite(value)) {
    throw new Error("EVALUATION_TIME_REQUIRED");
  }
  return value;
}

export function validateMarketSignal(signal, evaluationTime) {
  const now = requireEvaluationTime(evaluationTime);
  const validation = createValidation();

  if (!signal || typeof signal !== "object" || Array.isArray(signal)) {
    pushIssue(validation, GATE_RESULTS.REJECT, "signal", GATE_REASON_CODES.SCHEMA_INVALID, "Signal must be an object.");
    return validation;
  }

  validateMockBoundary(signal, validation);

  if (!Object.values(SOURCE_TYPES).includes(signal.sourceType)) {
    pushIssue(validation, GATE_RESULTS.REJECT, "sourceType", GATE_REASON_CODES.SCHEMA_INVALID, "sourceType is invalid.");
  }
  if (!Object.values(SOURCE_TIERS).includes(signal.sourceTier)) {
    pushIssue(validation, GATE_RESULTS.REJECT, "sourceTier", GATE_REASON_CODES.SCHEMA_INVALID, "sourceTier is invalid.");
  }
  if (!signal.provenance || typeof signal.provenance !== "object") {
    pushIssue(validation, GATE_RESULTS.HOLD, "provenance", GATE_REASON_CODES.PROVENANCE_MISSING, "provenance is required.");
  }
  if (!signal.marketKey || !signal.region || !signal.language || !signal.revenueModel || !signal.lane) {
    pushIssue(validation, GATE_RESULTS.HOLD, "market", GATE_REASON_CODES.MARKET_INVALID, "market fields are required.");
  }
  if (!isSignalWithinTtl(signal, now)) {
    pushIssue(validation, GATE_RESULTS.HOLD, "expiresAt", GATE_REASON_CODES.SIGNAL_EXPIRED, "Signal is expired.");
  }

  return validation;
}

export function validateForecast(forecast) {
  const validation = createValidation();

  if (!forecast || typeof forecast !== "object") {
    pushIssue(validation, GATE_RESULTS.HOLD, "forecastRevenueRange", GATE_REASON_CODES.FORECAST_INVALID, "Forecast is required.");
    return validation;
  }

  const low = Number(forecast.low);
  const base = Number(forecast.base);
  const high = Number(forecast.high);
  const periodDays = Number(forecast.periodDays);

  if (forecast.currency !== "JPY" || forecast.isMock !== true) {
    pushIssue(validation, GATE_RESULTS.HOLD, "forecastRevenueRange", GATE_REASON_CODES.FORECAST_INVALID, "Forecast must be mock JPY.");
  }
  if (![low, base, high, periodDays].every(Number.isFinite) || low > base || base > high || periodDays > THRESHOLDS.MAX_TIME_TO_REVENUE_DAYS) {
    pushIssue(validation, GATE_RESULTS.HOLD, "forecastRevenueRange", GATE_REASON_CODES.FORECAST_INVALID, "Forecast range is invalid.");
  }
  if (!Array.isArray(forecast.assumptions) || forecast.assumptions.length < 1) {
    pushIssue(validation, GATE_RESULTS.HOLD, "forecastRevenueRange.assumptions", GATE_REASON_CODES.FORECAST_INVALID, "Forecast assumptions are required.");
  }

  return validation;
}

function validateScores(entity) {
  const validation = createValidation();
  for (const field of SCORE_FIELDS) {
    if (!hasOwn(entity, field) || !Number.isFinite(Number(entity[field]))) {
      pushIssue(validation, GATE_RESULTS.HOLD, field, GATE_REASON_CODES.REQUIRED_SCORE_MISSING, `${field} is required.`);
    }
  }
  return validation;
}

function isSignalWithinTtl(signal, evaluationTime) {
  const now = requireEvaluationTime(evaluationTime);
  const expiresAt = Date.parse(signal.expiresAt || "");
  return Number.isFinite(expiresAt) && expiresAt > now;
}

function getRemainingTtlRatio(signal, evaluationTime) {
  const now = requireEvaluationTime(evaluationTime);
  const observedAt = Date.parse(signal.observedAt || "");
  const expiresAt = Date.parse(signal.expiresAt || "");
  if (!Number.isFinite(observedAt) || !Number.isFinite(expiresAt) || expiresAt <= now) return 0;
  const total = Math.max(expiresAt - observedAt, DAY_MS);
  return clamp((expiresAt - now) / total, 0, 1);
}

export function enrichSignals(rawSignals = [], evaluationTime) {
  const now = requireEvaluationTime(evaluationTime);
  return rawSignals.map((signal) => {
    const signalId = createDeterministicId("signal", {
      signalKey: normalizeIdentifier(signal.signalKey),
      sourceType: signal.sourceType,
      sourceTier: signal.sourceTier,
      marketKey: normalizeIdentifier(signal.marketKey),
      topic: normalizeIdentifier(signal.topic),
      region: normalizeIdentifier(signal.region),
      language: normalizeIdentifier(signal.language),
      revenueModel: normalizeIdentifier(signal.revenueModel),
      lane: normalizeIdentifier(signal.lane),
    });
    return {
      ...signal,
      signalId: signalId.id,
      canonical: signalId.canonical,
      validation: validateMarketSignal(signal, now),
    };
  });
}

export function buildMarkets(rawSignals = [], evaluationTime) {
  const now = requireEvaluationTime(evaluationTime);
  const signals = enrichSignals(rawSignals, now).filter((signal) => signal.validation.result !== GATE_RESULTS.REJECT);
  const groups = new Map();

  for (const signal of signals) {
    const key = canonicalize({
      marketKey: normalizeIdentifier(signal.marketKey),
      region: normalizeIdentifier(signal.region),
      language: normalizeIdentifier(signal.language),
      revenueModel: normalizeIdentifier(signal.revenueModel),
      lane: normalizeIdentifier(signal.lane),
    });
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(signal);
  }

  return [...groups.values()].map((group) => {
    const first = group[0];
    const marketId = createDeterministicId("market", {
      marketKey: normalizeIdentifier(first.marketKey),
      region: normalizeIdentifier(first.region),
      language: normalizeIdentifier(first.language),
      revenueModel: normalizeIdentifier(first.revenueModel),
      lane: normalizeIdentifier(first.lane),
    });
    const expiresAt = earliestDate(group.map((signal) => signal.expiresAt));
    const market = {
      schemaVersion: MARKET_INTELLIGENCE_SCHEMA_VERSION,
      marketId: marketId.id,
      canonical: marketId.canonical,
      marketKey: first.marketKey,
      correlationId: marketId.id,
      dataMode: DATA_MODES.MOCK,
      isMock: true,
      title: first.title,
      customerProblem: first.customerProblem,
      targetAudience: first.targetAudience,
      region: first.region,
      language: first.language,
      channel: first.channel,
      revenueModel: first.revenueModel,
      lane: first.lane,
      supportingSignalIds: group.map((signal) => signal.signalId).sort(),
      signals: group,
      provenance: {
        sourceNames: [...new Set(group.map((signal) => signal.provenance?.sourceName).filter(Boolean))].sort(),
      },
      createdAt: first.observedAt,
      expiresAt,
    };
    market.validation = validateMarket(market, now);
    return market;
  });
}

export function validateMarket(market, evaluationTime) {
  const now = requireEvaluationTime(evaluationTime);
  const validation = createValidation();
  validateMockBoundary(market, validation);

  if (!market.marketId || !market.marketKey || !market.revenueModel || !market.lane) {
    pushIssue(validation, GATE_RESULTS.HOLD, "market", GATE_REASON_CODES.MARKET_INVALID, "Market identity is required.");
  }
  if (!Array.isArray(market.supportingSignalIds) || market.supportingSignalIds.length < THRESHOLDS.MIN_SUPPORTING_SIGNALS) {
    pushIssue(validation, GATE_RESULTS.HOLD, "supportingSignalIds", GATE_REASON_CODES.INSUFFICIENT_SIGNALS, "At least two signals are required.");
  }
  const sourceTypes = new Set((market.signals || []).map((signal) => signal.sourceType));
  if (sourceTypes.size < THRESHOLDS.MIN_SOURCE_TYPES) {
    pushIssue(validation, GATE_RESULTS.HOLD, "sourceType", GATE_REASON_CODES.INSUFFICIENT_SOURCE_DIVERSITY, "At least two source types are required.");
  }
  if ((market.signals || []).some((signal) => !isSignalWithinTtl(signal, now))) {
    pushIssue(validation, GATE_RESULTS.HOLD, "expiresAt", GATE_REASON_CODES.SIGNAL_EXPIRED, "Every supporting signal must be within TTL.");
  }

  return validation;
}

export function buildOpportunities(rawSignals = [], evaluationTime) {
  const now = requireEvaluationTime(evaluationTime);
  const markets = buildMarkets(rawSignals, now);
  const opportunities = markets.map((market) => buildOpportunityFromMarket(market, now));
  const collisions = detectIdCollisions(opportunities.map((opportunity) => ({ id: opportunity.opportunityId, canonical: opportunity.canonical })));

  if (collisions.length) {
    return opportunities.map((opportunity) => {
      if (!collisions.includes(opportunity.opportunityId)) return opportunity;
      const validation = createValidation();
      pushIssue(validation, GATE_RESULTS.REJECT, "opportunityId", GATE_REASON_CODES.ID_COLLISION, "Deterministic ID collision detected.");
      return { ...opportunity, validation, state: OPPORTUNITY_STATES.REJECTED };
    });
  }

  return opportunities;
}

export function buildOpportunityFromMarket(market, evaluationTime) {
  const now = requireEvaluationTime(evaluationTime);
  const signals = market.signals || [];
  const opportunityVersion = fnv1a64(canonicalize({
    schemaVersion: MARKET_INTELLIGENCE_SCHEMA_VERSION,
    marketId: market.marketId,
    signalIds: signals.map((signal) => signal.signalId).sort(),
  })).slice(0, 12);
  const aggregate = aggregateScores(signals, market.lane);
  const adjustedConfidence = calculateAdjustedConfidence(signals);
  const penalties = calculatePenalties({ ...aggregate, signals, legalPolicyRisk: aggregate.legalPolicyRisk }, now);
  const baseScore = calculateBaseScore(market.lane, aggregate);
  const finalScore = calculateFinalScore(baseScore, adjustedConfidence, penalties.totalPenalty);
  const opportunityId = createDeterministicId("opportunity", {
    opportunityVersion,
    marketId: market.marketId,
    marketKey: normalizeIdentifier(market.marketKey),
    region: normalizeIdentifier(market.region),
    language: normalizeIdentifier(market.language),
    revenueModel: normalizeIdentifier(market.revenueModel),
    lane: normalizeIdentifier(market.lane),
  });
  const expiresAt = earliestDate(signals.map((signal) => signal.expiresAt));
  const opportunity = {
    schemaVersion: MARKET_INTELLIGENCE_SCHEMA_VERSION,
    opportunityId: opportunityId.id,
    canonical: opportunityId.canonical,
    opportunityVersion,
    marketId: market.marketId,
    correlationId: market.correlationId,
    dataMode: DATA_MODES.MOCK,
    isMock: true,
    lane: market.lane,
    title: market.title,
    customerProblem: market.customerProblem,
    targetAudience: market.targetAudience,
    region: market.region,
    language: market.language,
    revenueModel: market.revenueModel,
    recommendedChannel: market.channel,
    supportingSignalIds: market.supportingSignalIds,
    monetizationEvidence: [...new Set(signals.flatMap((signal) => signal.monetizationEvidence || []))].sort(),
    ...aggregate,
    adjustedConfidence,
    ...penalties,
    baseScore,
    finalScore,
    forecastRevenueRange: mergeForecasts(signals),
    provenance: market.provenance,
    riskFlags: [...new Set(signals.flatMap((signal) => signal.riskFlags || []))].sort(),
    state: OPPORTUNITY_STATES.VALIDATING,
    createdAt: market.createdAt,
    expiresAt,
    signals,
  };
  const validation = applyHardGate(opportunity, now);
  return {
    ...opportunity,
    validation,
    state: stateFromValidation(validation),
  };
}

function aggregateScores(signals, lane) {
  const average = (mapper) => {
    const values = signals.map(mapper).map(Number).filter(Number.isFinite);
    return values.length ? roundTo1Decimal(values.reduce((sum, value) => sum + value, 0) / values.length) : undefined;
  };
  const competitionRaw = average((signal) => signal.competition);
  const normalizedValue = average((signal) => signal.normalizedValue);
  const commercialIntent = average((signal) => signal.commercialIntent);
  const monetizationValues = signals
    .filter((signal) => (signal.monetizationEvidence || []).length > 0)
    .map((signal) => Number(signal.normalizedValue))
    .filter(Number.isFinite);
  const requiredCost = Math.max(...signals.map((signal) => Number(signal.requiredCost)).filter(Number.isFinite));
  const validationBudget = Math.max(...signals.map((signal) => Number(signal.validationBudget)).filter(Number.isFinite));
  const estimatedTimeToRevenue = Math.min(...signals.map((signal) => Number(signal.estimatedTimeToRevenue)).filter(Number.isFinite));
  const evidenceCount = new Set(signals.flatMap((signal) => signal.monetizationEvidence || [])).size;

  return {
    demandScore: normalizedValue,
    commercialIntentScore: commercialIntent,
    monetizationScore: roundTo1Decimal(clamp(averageNumber(monetizationValues) + evidenceCount * 4)),
    competitionGapScore: roundTo1Decimal(clamp(100 - (competitionRaw || 0))),
    executionSpeedScore: roundTo1Decimal(clamp(100 - estimatedTimeToRevenue * 2)),
    ownerLeverageScore: lane === LANES.ASSET ? 90 : 86,
    automationPotentialScore: lane === LANES.ASSET ? 92 : 80,
    compoundingPotentialScore: lane === LANES.ASSET ? 94 : 70,
    legalPolicyRisk: highestRisk(signals.map((signal) => signal.legalPolicyRisk)),
    requiredCost,
    validationBudget,
    estimatedTimeToRevenue,
  };
}

export function calculateAdjustedConfidence(signals = []) {
  const validSignals = signals.filter((signal) => signal.validation?.result !== GATE_RESULTS.REJECT);
  if (!validSignals.length) return 0;

  const effective = validSignals.map((signal) => {
    const adjustment = SOURCE_TIER_ADJUSTMENTS[signal.sourceTier] ?? 0;
    return clamp(Number(signal.confidence) + adjustment, 0, THRESHOLDS.MAX_ADJUSTED_CONFIDENCE);
  });
  const averageEffectiveConfidence = effective.reduce((sum, value) => sum + value, 0) / effective.length;
  const distinctSourceTypeCount = new Set(validSignals.map((signal) => signal.sourceType)).size;
  const sourceDiversityBonus = distinctSourceTypeCount >= 3 ? 10 : distinctSourceTypeCount === 2 ? 5 : 0;

  return roundTo1Decimal(clamp(averageEffectiveConfidence + sourceDiversityBonus, 0, THRESHOLDS.MAX_ADJUSTED_CONFIDENCE));
}

export function calculateBaseScore(lane, opportunity) {
  const weights = lane === LANES.ASSET ? ASSET_LANE_WEIGHTS : CASH_LANE_WEIGHTS;
  const score = Object.entries(weights).reduce((sum, [field, weight]) => sum + Number(opportunity[field]) * weight, 0);
  return roundTo1Decimal(clamp(score, 0, 100));
}

export function calculatePenalties(opportunity, evaluationTime) {
  const now = requireEvaluationTime(evaluationTime);
  const legalPolicyPenalty = calculateLegalPolicyPenalty(opportunity.legalPolicyRisk);
  const costPenalty = calculateCostPenalty(opportunity.requiredCost, opportunity.validationBudget);
  const stalenessPenalty = calculateStalenessPenalty(opportunity.signals || [], now);
  const sourceConcentrationPenalty = calculateSourceConcentrationPenalty(opportunity.signals || []);
  const totalPenalty = Math.min(
    THRESHOLDS.MAX_TOTAL_PENALTY,
    legalPolicyPenalty + costPenalty + stalenessPenalty + sourceConcentrationPenalty
  );

  return {
    legalPolicyPenalty,
    costPenalty,
    stalenessPenalty,
    sourceConcentrationPenalty,
    totalPenalty,
  };
}

function calculateLegalPolicyPenalty(risk) {
  if (risk === "medium") return PENALTY_VALUES.legalPolicy.medium;
  if (risk === "low") return PENALTY_VALUES.legalPolicy.low;
  return PENALTY_VALUES.legalPolicy.none;
}

function calculateCostPenalty(requiredCost, validationBudget) {
  const cost = Number(requiredCost);
  const budget = Number(validationBudget);
  if (!Number.isFinite(cost) || !Number.isFinite(budget) || budget <= 0) return 10;
  const ratio = cost / budget;
  return PENALTY_VALUES.cost.find((entry) => ratio <= entry.maxRatio)?.penalty ?? 10;
}

function calculateStalenessPenalty(signals, now) {
  if (!signals.length) return 5;
  const minRatio = Math.min(...signals.map((signal) => getRemainingTtlRatio(signal, now)));
  return PENALTY_VALUES.staleness.find((entry) => minRatio >= entry.minRemainingRatio)?.penalty ?? 5;
}

function calculateSourceConcentrationPenalty(signals) {
  if (!signals.length) return 5;
  const counts = new Map();
  for (const signal of signals) {
    counts.set(signal.sourceType, (counts.get(signal.sourceType) || 0) + 1);
  }
  if (counts.size < THRESHOLDS.MIN_SOURCE_TYPES) return 5;
  const dominantRatio = Math.max(...counts.values()) / signals.length;
  return PENALTY_VALUES.sourceConcentration.find((entry) => dominantRatio <= entry.maxDominantRatio)?.penalty ?? 5;
}

export function calculateFinalScore(baseScore, adjustedConfidence, totalPenalty) {
  const confidenceFactor = 0.6 + Number(adjustedConfidence) / 250;
  return roundTo1Decimal(clamp(Number(baseScore) * confidenceFactor - Number(totalPenalty), 0, 100));
}

export function applyHardGate(opportunity, evaluationTime) {
  const now = requireEvaluationTime(evaluationTime);
  if (!opportunity || typeof opportunity !== "object" || Array.isArray(opportunity)) {
    return validateOpportunityShell(opportunity);
  }
  const preScore = [
    validateOpportunityShell(opportunity),
    validateScores(opportunity),
    validateForecast(opportunity.forecastRevenueRange),
  ];
  const validation = mergeValidations(preScore);
  const signals = opportunity.signals || [];
  const sourceTypes = new Set(signals.map((signal) => signal.sourceType));

  if (!Array.isArray(opportunity.supportingSignalIds) || opportunity.supportingSignalIds.length < THRESHOLDS.MIN_SUPPORTING_SIGNALS) {
    pushIssue(validation, GATE_RESULTS.HOLD, "supportingSignalIds", GATE_REASON_CODES.INSUFFICIENT_SIGNALS, "At least two supporting signals are required.");
  }
  if (sourceTypes.size < THRESHOLDS.MIN_SOURCE_TYPES) {
    pushIssue(validation, GATE_RESULTS.HOLD, "sourceType", GATE_REASON_CODES.INSUFFICIENT_SOURCE_DIVERSITY, "At least two source types are required.");
  }
  if (signals.some((signal) => !isSignalWithinTtl(signal, now))) {
    pushIssue(validation, GATE_RESULTS.HOLD, "expiresAt", GATE_REASON_CODES.SIGNAL_EXPIRED, "Signals must be within TTL.");
  }
  if (signals.some((signal) => signal.validation?.reasonCodes?.includes(GATE_REASON_CODES.PROVENANCE_MISSING))) {
    pushIssue(validation, GATE_RESULTS.HOLD, "provenance", GATE_REASON_CODES.PROVENANCE_MISSING, "Every supporting signal must include provenance.");
  }
  if (!Number.isFinite(Number(opportunity.validationBudget))) {
    pushIssue(validation, GATE_RESULTS.HOLD, "validationBudget", GATE_REASON_CODES.BUDGET_UNDEFINED, "validationBudget is required.");
  }
  if (!opportunity.monetizationEvidence?.length) {
    pushIssue(validation, GATE_RESULTS.HOLD, "monetizationEvidence", GATE_REASON_CODES.NO_MONETIZATION_EVIDENCE, "Monetization evidence is required.");
  }
  if (!opportunity.revenueModel) {
    pushIssue(validation, GATE_RESULTS.HOLD, "revenueModel", GATE_REASON_CODES.REVENUE_MODEL_MISSING, "revenueModel is required.");
  }
  if (Number(opportunity.estimatedTimeToRevenue) > THRESHOLDS.MAX_TIME_TO_REVENUE_DAYS) {
    pushIssue(validation, GATE_RESULTS.HOLD, "estimatedTimeToRevenue", GATE_REASON_CODES.TIME_TO_REVENUE_TOO_LONG, "Time to revenue must be within 30 days.");
  }
  if (["high", "critical"].includes(opportunity.legalPolicyRisk)) {
    pushIssue(validation, GATE_RESULTS.REJECT, "legalPolicyRisk", GATE_REASON_CODES.HIGH_RISK_DETECTED, "High or critical risk is rejected.");
  }
  if (validation.result === GATE_RESULTS.PASS && Number(opportunity.adjustedConfidence) < THRESHOLDS.MIN_ADJUSTED_CONFIDENCE) {
    pushIssue(validation, GATE_RESULTS.HOLD, "adjustedConfidence", GATE_REASON_CODES.CONFIDENCE_TOO_LOW, "adjustedConfidence is below threshold.");
  }
  if (validation.result === GATE_RESULTS.PASS && Number(opportunity.finalScore) < THRESHOLDS.MIN_FINAL_SCORE) {
    pushIssue(validation, GATE_RESULTS.HOLD, "finalScore", GATE_REASON_CODES.SCORE_TOO_LOW, "finalScore is below threshold.");
  }

  return validation;
}

function validateOpportunityShell(opportunity) {
  const validation = createValidation();
  if (!opportunity || typeof opportunity !== "object" || Array.isArray(opportunity)) {
    pushIssue(validation, GATE_RESULTS.REJECT, "opportunity", GATE_REASON_CODES.SCHEMA_INVALID, "Opportunity must be an object.");
    return validation;
  }
  validateMockBoundary(opportunity, validation);
  if (!opportunity.opportunityId || !opportunity.opportunityVersion) {
    pushIssue(validation, GATE_RESULTS.REJECT, "opportunityId", GATE_REASON_CODES.SCHEMA_INVALID, "Opportunity identity fields are required.");
  }
  if (!opportunity.marketId) {
    pushIssue(validation, GATE_RESULTS.HOLD, "marketId", GATE_REASON_CODES.MARKET_INVALID, "marketId is required.");
  }
  if (!opportunity.provenance || typeof opportunity.provenance !== "object") {
    pushIssue(validation, GATE_RESULTS.HOLD, "provenance", GATE_REASON_CODES.PROVENANCE_MISSING, "provenance is required.");
  }
  return validation;
}

function stateFromValidation(validation) {
  if (validation.result === GATE_RESULTS.REJECT) return OPPORTUNITY_STATES.REJECTED;
  if (validation.result === GATE_RESULTS.HOLD) {
    if (validation.reasonCodes.includes(GATE_REASON_CODES.SIGNAL_EXPIRED)) return OPPORTUNITY_STATES.EXPIRED;
    return OPPORTUNITY_STATES.HOLD;
  }
  return OPPORTUNITY_STATES.ELIGIBLE;
}

export function rankSort(a, b) {
  return (
    Number(b.finalScore) - Number(a.finalScore) ||
    Number(b.adjustedConfidence) - Number(a.adjustedConfidence) ||
    Number(a.estimatedTimeToRevenue) - Number(b.estimatedTimeToRevenue) ||
    Number(b.monetizationScore) - Number(a.monetizationScore) ||
    Number(b.ownerLeverageScore) - Number(a.ownerLeverageScore) ||
    Date.parse(b.expiresAt || 0) - Date.parse(a.expiresAt || 0) ||
    String(a.opportunityId).localeCompare(String(b.opportunityId))
  );
}

export function selectDeterministicTop3(opportunities = []) {
  const eligible = opportunities
    .filter((opportunity) => opportunity.validation?.result === GATE_RESULTS.PASS)
    .filter((opportunity) => opportunity.adjustedConfidence >= THRESHOLDS.MIN_ADJUSTED_CONFIDENCE)
    .filter((opportunity) => opportunity.finalScore >= THRESHOLDS.MIN_FINAL_SCORE)
    .sort(rankSort);

  const assetCount = eligible.filter((opportunity) => opportunity.lane === LANES.ASSET).length;

  for (let size = Math.min(3, eligible.length); size > 0; size -= 1) {
    const combinations = combinationsOf(eligible, size);
    const validGroups = combinations.filter((group) => isValidTopGroup(group, assetCount));
    if (validGroups.length) return bestGroup(validGroups);
  }

  return [];
}

function isValidTopGroup(group, eligibleAssetCount) {
  if (!group.length || group.length > 3) return false;
  if (maxCountBy(group, "marketId") > 1) return false;
  if (maxCountBy(group, "revenueModel") > 2) return false;
  if (countLane(group, LANES.CASH) > 2 && eligibleAssetCount > 0) return false;
  if (eligibleAssetCount > 0 && countLane(group, LANES.ASSET) < 1) return false;
  if (eligibleAssetCount === 0 && countLane(group, LANES.CASH) > 3) return false;
  return true;
}

function bestGroup(groups) {
  return [...groups]
    .sort((a, b) => {
      const byLength = b.length - a.length;
      const byScore = sumBy(b, "finalScore") - sumBy(a, "finalScore");
      const byConfidence = sumBy(b, "adjustedConfidence") - sumBy(a, "adjustedConfidence");
      const byTime = sumBy(a, "estimatedTimeToRevenue") - sumBy(b, "estimatedTimeToRevenue");
      const byIds = a.map((item) => item.opportunityId).sort().join("|").localeCompare(b.map((item) => item.opportunityId).sort().join("|"));
      return byLength || byScore || byConfidence || byTime || byIds;
    })[0]
    .sort(rankSort);
}

function combinationsOf(items, size) {
  const result = [];
  const walk = (start, group) => {
    if (group.length === size) {
      result.push(group);
      return;
    }
    for (let index = start; index < items.length; index += 1) {
      walk(index + 1, [...group, items[index]]);
    }
  };
  walk(0, []);
  return result;
}

function maxCountBy(items, field) {
  const counts = new Map();
  for (const item of items) counts.set(item[field], (counts.get(item[field]) || 0) + 1);
  return Math.max(0, ...counts.values());
}

function countLane(items, lane) {
  return items.filter((item) => item.lane === lane).length;
}

function sumBy(items, field) {
  return items.reduce((sum, item) => sum + Number(item[field] || 0), 0);
}

function mergeForecasts(signals = []) {
  const forecasts = signals.map((signal) => signal.forecastRevenueRange).filter(Boolean);
  return {
    currency: "JPY",
    low: Math.min(...forecasts.map((forecast) => Number(forecast.low)).filter(Number.isFinite)),
    base: roundTo1Decimal(averageNumber(forecasts.map((forecast) => Number(forecast.base)))),
    high: Math.max(...forecasts.map((forecast) => Number(forecast.high)).filter(Number.isFinite)),
    periodDays: Math.max(...forecasts.map((forecast) => Number(forecast.periodDays)).filter(Number.isFinite)),
    assumptions: [...new Set(forecasts.flatMap((forecast) => forecast.assumptions || []))].sort(),
    confidence: roundTo1Decimal(averageNumber(forecasts.map((forecast) => Number(forecast.confidence)))),
    isMock: true,
  };
}

function averageNumber(values) {
  const clean = values.filter(Number.isFinite);
  return clean.length ? clean.reduce((sum, value) => sum + value, 0) / clean.length : 0;
}

function earliestDate(dates) {
  return dates.filter(Boolean).sort((a, b) => Date.parse(a) - Date.parse(b))[0] || null;
}

function highestRisk(risks = []) {
  const order = ["none", "low", "medium", "high", "critical"];
  return risks.reduce((highest, risk) => (order.indexOf(risk) > order.indexOf(highest) ? risk : highest), "none");
}

export function buildMarketIntelligenceFoundation(signals, evaluationTime) {
  const now = requireEvaluationTime(evaluationTime);
  const opportunities = buildOpportunities(signals, now);
  const top3 = selectDeterministicTop3(opportunities);
  return {
    schemaVersion: MARKET_INTELLIGENCE_SCHEMA_VERSION,
    dataMode: DATA_MODES.MOCK,
    isMock: true,
    opportunities,
    top3,
  };
}
