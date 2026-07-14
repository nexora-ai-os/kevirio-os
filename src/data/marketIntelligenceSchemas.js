export const MARKET_INTELLIGENCE_SCHEMA_VERSION = "2.0.0";

export const DATA_MODES = Object.freeze({
  MOCK: "mock",
  REAL: "real",
});

export const SOURCE_TYPES = Object.freeze({
  MANUAL_SAMPLE: "manualSample",
  MOCK_PUBLIC_DEMAND: "mockPublicDemand",
  MOCK_COMPETITION: "mockCompetition",
  MOCK_MONETIZATION: "mockMonetization",
  MOCK_OWNED_PERFORMANCE: "mockOwnedPerformance",
});

export const SOURCE_TIERS = Object.freeze({
  MOCK_PRIMARY: "mockPrimary",
  MOCK_SECONDARY: "mockSecondary",
  MANUAL_SAMPLE: "manualSample",
});

export const SOURCE_TIER_ADJUSTMENTS = Object.freeze({
  [SOURCE_TIERS.MOCK_PRIMARY]: 0,
  [SOURCE_TIERS.MOCK_SECONDARY]: -5,
  [SOURCE_TIERS.MANUAL_SAMPLE]: -10,
});

export const SOURCE_TTL_DAYS = Object.freeze({
  [SOURCE_TYPES.MANUAL_SAMPLE]: 7,
  [SOURCE_TYPES.MOCK_PUBLIC_DEMAND]: 3,
  [SOURCE_TYPES.MOCK_COMPETITION]: 7,
  [SOURCE_TYPES.MOCK_MONETIZATION]: 7,
  [SOURCE_TYPES.MOCK_OWNED_PERFORMANCE]: 3,
});

export const LANES = Object.freeze({
  CASH: "cash",
  ASSET: "asset",
});

export const OPPORTUNITY_STATES = Object.freeze({
  DRAFT: "draft",
  VALIDATING: "validating",
  HOLD: "hold",
  ELIGIBLE: "eligible",
  RECOMMENDED: "recommended",
  APPROVED: "approved",
  REJECTED: "rejected",
  EXPIRED: "expired",
  HANDED_OFF: "handedOff",
  SUPERSEDED: "superseded",
});

export const P0_013A_STATES = Object.freeze([
  OPPORTUNITY_STATES.DRAFT,
  OPPORTUNITY_STATES.VALIDATING,
  OPPORTUNITY_STATES.HOLD,
  OPPORTUNITY_STATES.ELIGIBLE,
  OPPORTUNITY_STATES.RECOMMENDED,
  OPPORTUNITY_STATES.REJECTED,
  OPPORTUNITY_STATES.EXPIRED,
]);

export const GATE_RESULTS = Object.freeze({
  PASS: "pass",
  HOLD: "hold",
  REJECT: "reject",
});

export const GATE_REASON_CODES = Object.freeze({
  SCHEMA_INVALID: "SCHEMA_INVALID",
  SCHEMA_VERSION_MISMATCH: "SCHEMA_VERSION_MISMATCH",
  REAL_DATA_NOT_ALLOWED: "REAL_DATA_NOT_ALLOWED",
  MOCK_FLAG_REQUIRED: "MOCK_FLAG_REQUIRED",
  PRODUCTION_NOT_ALLOWED: "PRODUCTION_NOT_ALLOWED",
  EXTERNAL_EXECUTION_NOT_ALLOWED: "EXTERNAL_EXECUTION_NOT_ALLOWED",
  ACTUAL_REVENUE_DEPENDENCY: "ACTUAL_REVENUE_DEPENDENCY",
  PROVENANCE_MISSING: "PROVENANCE_MISSING",
  MARKET_INVALID: "MARKET_INVALID",
  INSUFFICIENT_SIGNALS: "INSUFFICIENT_SIGNALS",
  INSUFFICIENT_SOURCE_DIVERSITY: "INSUFFICIENT_SOURCE_DIVERSITY",
  SIGNAL_EXPIRED: "SIGNAL_EXPIRED",
  REQUIRED_SCORE_MISSING: "REQUIRED_SCORE_MISSING",
  BUDGET_UNDEFINED: "BUDGET_UNDEFINED",
  NO_MONETIZATION_EVIDENCE: "NO_MONETIZATION_EVIDENCE",
  REVENUE_MODEL_MISSING: "REVENUE_MODEL_MISSING",
  FORECAST_INVALID: "FORECAST_INVALID",
  TIME_TO_REVENUE_TOO_LONG: "TIME_TO_REVENUE_TOO_LONG",
  HIGH_RISK_DETECTED: "HIGH_RISK_DETECTED",
  CONFIDENCE_TOO_LOW: "CONFIDENCE_TOO_LOW",
  SCORE_TOO_LOW: "SCORE_TOO_LOW",
  ID_COLLISION: "ID_COLLISION",
});

export const CASH_LANE_WEIGHTS = Object.freeze({
  demandScore: 0.15,
  commercialIntentScore: 0.2,
  monetizationScore: 0.2,
  competitionGapScore: 0.1,
  executionSpeedScore: 0.15,
  ownerLeverageScore: 0.1,
  automationPotentialScore: 0.05,
  compoundingPotentialScore: 0.05,
});

export const ASSET_LANE_WEIGHTS = Object.freeze({
  demandScore: 0.18,
  commercialIntentScore: 0.1,
  monetizationScore: 0.15,
  competitionGapScore: 0.12,
  executionSpeedScore: 0.05,
  ownerLeverageScore: 0.15,
  automationPotentialScore: 0.12,
  compoundingPotentialScore: 0.13,
});

export const SCORE_FIELDS = Object.freeze(Object.keys(CASH_LANE_WEIGHTS));

export const THRESHOLDS = Object.freeze({
  MIN_ADJUSTED_CONFIDENCE: 60,
  MIN_FINAL_SCORE: 70,
  MAX_ADJUSTED_CONFIDENCE: 85,
  MAX_TOTAL_PENALTY: 30,
  MAX_TIME_TO_REVENUE_DAYS: 30,
  MIN_SUPPORTING_SIGNALS: 2,
  MIN_SOURCE_TYPES: 2,
});

export const PENALTY_VALUES = Object.freeze({
  legalPolicy: Object.freeze({
    none: 0,
    low: 3,
    medium: 10,
  }),
  cost: Object.freeze([
    { maxRatio: 0.1, penalty: 0 },
    { maxRatio: 0.25, penalty: 2 },
    { maxRatio: 0.5, penalty: 5 },
    { maxRatio: 0.75, penalty: 8 },
    { maxRatio: Infinity, penalty: 10 },
  ]),
  staleness: Object.freeze([
    { minRemainingRatio: 0.5, penalty: 0 },
    { minRemainingRatio: 0.25, penalty: 2 },
    { minRemainingRatio: 0.1, penalty: 4 },
    { minRemainingRatio: 0, penalty: 5 },
  ]),
  sourceConcentration: Object.freeze([
    { maxDominantRatio: 0.5, penalty: 0 },
    { maxDominantRatio: 0.7, penalty: 2 },
    { maxDominantRatio: 0.85, penalty: 4 },
    { maxDominantRatio: 1, penalty: 5 },
  ]),
});

export const FORBIDDEN_REVENUE_FIELDS = Object.freeze([
  "actualRevenue",
  "realizedRevenue",
  "confirmedRevenue",
  "productionRevenue",
]);
