import {
  DATA_MODES,
  GATE_REASON_CODES,
  GATE_RESULTS,
  LANES,
  MARKET_INTELLIGENCE_SCHEMA_VERSION,
  THRESHOLDS,
} from "../data/marketIntelligenceSchemas.js";

const FORBIDDEN_REVENUE_FIELDS = new Set([
  "actualRevenue",
  "realizedRevenue",
  "confirmedRevenue",
  "productionRevenue",
]);

const BLOCKED_REASON_MESSAGES = Object.freeze({
  [GATE_REASON_CODES.SCORE_TOO_LOW]: "推奨基準に達していない候補があります。",
  [GATE_REASON_CODES.CONFIDENCE_TOO_LOW]: "根拠データが不足している候補があります。",
  [GATE_REASON_CODES.SIGNAL_EXPIRED]: "再調査が必要な候補があります。",
  [GATE_REASON_CODES.NO_MONETIZATION_EVIDENCE]: "収益経路を確認できない候補があります。",
  [GATE_REASON_CODES.HIGH_RISK_DETECTED]: "安全上の理由で除外された候補があります。",
  [GATE_REASON_CODES.ACTUAL_REVENUE_DEPENDENCY]: "未接続の実売上データに依存する候補を除外しました。",
});

const LANE_LABELS = Object.freeze({
  [LANES.CASH]: "短期収益",
  [LANES.ASSET]: "資産形成",
});

const MARKET_TITLE_LABELS = Object.freeze({
  "Small Business SNS and Article Production": "小規模事業者向けSNS・記事制作",
  "AI Workflow Efficiency Support": "AI業務効率化支援",
  "AI Productivity Affiliate Media": "AI時短・業務効率化メディア",
  "Small Business Marketing Media": "小規模事業者向け集客メディア",
});

const CUSTOMER_PROBLEM_LABELS = Object.freeze({
  "Small businesses need frequent content but lack staff time.": "小規模事業者は継続的な情報発信が必要ですが、制作を担当する人員と時間が不足しています。",
  "Owners want AI efficiency but do not know what to automate first.": "事業者はAIで業務を効率化したい一方、最初に自動化すべき業務を判断できていません。",
  "Readers need practical AI tools that save time without heavy setup.": "読者は、複雑な設定なしで時間を削減できる実用的なAIツールを探しています。",
  "Small businesses need simple marketing guidance they can reuse.": "小規模事業者は、繰り返し使えるわかりやすい集客ノウハウを必要としています。",
});

const TARGET_AUDIENCE_LABELS = Object.freeze({
  "Local small business owners": "地域の小規模事業者・個人事業主",
  "Small teams and owner-operated businesses": "少人数チーム・オーナー経営の事業者",
  "Solo workers and small business operators": "一人事業者・小規模事業の運営者",
  "Local service businesses": "地域密着型のサービス事業者",
});

const VALUE_LABELS = Object.freeze({
  service: "サービス提供",
  lead: "見込み客獲得",
  affiliate: "アフィリエイト",
  media: "メディア収益",
  seo: "SEO",
  sns: "SNS",
});

const ASSUMPTION_LABELS = Object.freeze({
  "One mock service package sold within 30 days": "30日以内に初回サービスパッケージが1件成約する想定",
  "Mock pricing: one initial content bundle": "初回コンテンツ制作パックを1件販売する想定",
  "One mock diagnostic package closes from lead outreach": "見込み客への提案から診断パッケージが1件成約する想定",
  "Mock competitor offers support service pricing": "競合サービスの価格帯を参考にした支援サービス想定",
  "Mock SEO article set creates initial affiliate clicks": "SEO記事群から初期のアフィリエイトクリックが発生する想定",
  "Mock affiliate commission range and initial traffic assumption": "初期流入とアフィリエイト報酬レンジに基づく想定",
  "Mock media content creates future lead capture": "メディア記事から将来の見込み客獲得につながる想定",
  "Mock owned performance benchmark": "自社保有コンテンツのMock実績ベンチマーク",
});

const EVIDENCE_LABELS = Object.freeze({
  "service package mock assumption": "サービスパッケージ化できるMock根拠",
  "mock service fee range": "サービス単価レンジのMock根拠",
  "mock lead conversion assumption": "見込み客から成約へのMock想定",
  "mock consulting lead": "相談・診断サービスのMock見込み客",
  "mock competitor service offers": "競合サービス提供状況のMock根拠",
  "mock affiliate program availability": "アフィリエイト案件が存在するMock根拠",
  "mock affiliate commission assumption": "アフィリエイト報酬のMock想定",
  "mock lead magnet assumption": "資料請求・登録導線のMock想定",
  "mock owned content benchmark": "自社コンテンツ比較のMock根拠",
});

const RISK_LABELS = Object.freeze({
  "delivery-scope-risk": "納品範囲が広がる可能性",
  "owner-contact-required": "顧客対応にOwner確認が必要",
  "owner-sales-call-required": "成約前にOwnerの商談確認が必要",
  "competition-risk": "競合が多い可能性",
  "content-consistency-risk": "継続的な制作体制が必要",
  "slow-compounding": "成果の蓄積に時間がかかる可能性",
  "disclosure-required": "紹介・広告表記の確認が必要",
});

const PROVENANCE_LABELS = Object.freeze({
  "Mock demand board": "Mock需要ボード",
  "Mock monetization registry": "Mock収益化レジストリ",
  "Mock demand registry": "Mock需要レジストリ",
  "Mock competition board": "Mock競合ボード",
  "Mock public demand board": "Mock公開需要ボード",
  "Mock owned performance sample": "Mock自社実績サンプル",
});

const RISK_ORDER = ["none", "low", "medium", "high", "critical"];

function createError(code, field, message) {
  return { code, field, message };
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseEvaluationTime(evaluationTime) {
  if (typeof evaluationTime !== "string") return null;
  const time = Date.parse(evaluationTime);
  if (!Number.isFinite(time) || new Date(time).toISOString() !== evaluationTime) return null;
  return evaluationTime;
}

function walk(value, visit, path = []) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((entry, index) => walk(entry, visit, [...path, String(index)]));
    return;
  }
  for (const [key, entry] of Object.entries(value)) {
    visit(key, entry, [...path, key]);
    walk(entry, visit, [...path, key]);
  }
}

function validateSafetyBoundary(result) {
  const errors = [];
  walk(result, (key, value, path) => {
    const field = path.join(".");
    if (FORBIDDEN_REVENUE_FIELDS.has(key)) {
      errors.push(createError("ACTUAL_REVENUE_FIELD_FORBIDDEN", field, `${key} is not allowed in Market Intelligence ViewModel input.`));
    }
    if ((key === "productionExecution" || key === "production" || key === "mode") && (value === true || value === "production")) {
      errors.push(createError("PRODUCTION_NOT_ALLOWED", field, "Production execution is not allowed."));
    }
    if ((key === "externalExecution" || key === "isExternalRequest" || key === "externalCommunication") && value === true) {
      errors.push(createError("EXTERNAL_EXECUTION_NOT_ALLOWED", field, "External execution is not allowed."));
    }
  });
  return errors;
}

function validateFoundationResult(foundationResult, evaluationTime) {
  const errors = [];
  const normalizedEvaluationTime = parseEvaluationTime(evaluationTime);

  if (!normalizedEvaluationTime) {
    errors.push(createError("EVALUATION_TIME_INVALID", "evaluationTime", "evaluationTime must be an ISO 8601 string."));
  }
  if (!isPlainObject(foundationResult)) {
    return {
      evaluationTime: normalizedEvaluationTime,
      errors: [createError("FOUNDATION_RESULT_INVALID", "foundationResult", "foundationResult must be an object."), ...errors],
    };
  }
  if (foundationResult.schemaVersion !== MARKET_INTELLIGENCE_SCHEMA_VERSION) {
    errors.push(createError("SCHEMA_VERSION_MISMATCH", "schemaVersion", "schemaVersion must match the frozen Market Intelligence schema."));
  }
  if (foundationResult.dataMode !== DATA_MODES.MOCK) {
    errors.push(createError("REAL_DATA_NOT_ALLOWED", "dataMode", "Only mock dataMode is allowed."));
  }
  if (foundationResult.isMock !== true) {
    errors.push(createError("MOCK_FLAG_REQUIRED", "isMock", "isMock must be true."));
  }
  if (!Array.isArray(foundationResult.top3)) {
    errors.push(createError("TOP3_INVALID", "top3", "top3 must be an array."));
  } else if (foundationResult.top3.length > 3) {
    errors.push(createError("TOP3_TOO_LARGE", "top3", "top3 must contain at most 3 opportunities."));
  }
  if (!Array.isArray(foundationResult.opportunities)) {
    errors.push(createError("OPPORTUNITIES_INVALID", "opportunities", "opportunities must be an array."));
  }

  return {
    evaluationTime: normalizedEvaluationTime,
    errors: [...errors, ...validateSafetyBoundary(foundationResult)],
  };
}

function validateRecommendation(opportunity, evaluationTime) {
  const errors = [];
  const holds = [];

  if (!isPlainObject(opportunity)) {
    return { errors: [createError("OPPORTUNITY_INVALID", "recommendation", "Recommendation must be an object.")], holds };
  }

  const requiredFields = [
    "opportunityId",
    "opportunityVersion",
    "marketId",
    "correlationId",
    "lane",
    "title",
    "adjustedConfidence",
    "finalScore",
    "baseScore",
    "totalPenalty",
    "forecastRevenueRange",
    "expiresAt",
    "provenance",
    "riskFlags",
  ];

  for (const field of requiredFields) {
    if (opportunity[field] === undefined || opportunity[field] === null || opportunity[field] === "") {
      errors.push(createError("REQUIRED_FIELD_MISSING", field, `${field} is required.`));
    }
  }
  if (!Object.values(LANES).includes(opportunity.lane)) {
    errors.push(createError("LANE_INVALID", "lane", "lane must be cash or asset."));
  }
  if (!Number.isFinite(Number(opportunity.adjustedConfidence))) {
    errors.push(createError("CONFIDENCE_INVALID", "adjustedConfidence", "adjustedConfidence must be numeric."));
  } else if (Number(opportunity.adjustedConfidence) < THRESHOLDS.MIN_ADJUSTED_CONFIDENCE) {
    holds.push(createError("CONFIDENCE_TOO_LOW", "adjustedConfidence", "adjustedConfidence is below display threshold."));
  }
  for (const field of ["finalScore", "baseScore", "totalPenalty"]) {
    const value = Number(opportunity[field]);
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      errors.push(createError("SCORE_OUT_OF_RANGE", field, `${field} must be between 0 and 100.`));
    }
  }
  if (Number(opportunity.finalScore) < THRESHOLDS.MIN_FINAL_SCORE) {
    holds.push(createError("SCORE_TOO_LOW", "finalScore", "finalScore is below display threshold."));
  }
  const forecast = opportunity.forecastRevenueRange;
  if (!isPlainObject(forecast)) {
    holds.push(createError("FORECAST_INVALID", "forecastRevenueRange", "Forecast range is required."));
  } else {
    const low = Number(forecast.low);
    const base = Number(forecast.base);
    const high = Number(forecast.high);
    const periodDays = Number(forecast.periodDays);
    if (forecast.currency !== "JPY" || forecast.isMock !== true || ![low, base, high, periodDays].every(Number.isFinite) || low > base || base > high) {
      holds.push(createError("FORECAST_INVALID", "forecastRevenueRange", "Forecast range must be mock JPY and ordered low <= base <= high."));
    }
  }
  const expiresAt = Date.parse(opportunity.expiresAt || "");
  const now = Date.parse(evaluationTime || "");
  if (!Number.isFinite(expiresAt) || (Number.isFinite(now) && expiresAt <= now)) {
    holds.push(createError("SIGNAL_EXPIRED", "expiresAt", "Recommendation is expired."));
  }
  const risks = Array.isArray(opportunity.riskFlags) ? opportunity.riskFlags : [];
  const riskLevel = highestRisk([opportunity.legalPolicyRisk, ...risks]);
  if (riskLevel === "high" || riskLevel === "critical") {
    errors.push(createError("HIGH_RISK_DETECTED", "riskFlags", "High or critical risk is not displayable."));
  }

  return { errors, holds };
}

function highestRisk(values = []) {
  return values.reduce((highest, value) => {
    const normalized = String(value || "none").toLowerCase();
    return RISK_ORDER.indexOf(normalized) > RISK_ORDER.indexOf(highest) ? normalized : highest;
  }, "none");
}

function formatYen(value) {
  return `¥${Number(value).toLocaleString("ja-JP")}`;
}

function buildForecastLabel(forecast) {
  return `${formatYen(forecast.low)}〜${formatYen(forecast.base)} / ${forecast.periodDays}日`;
}

function buildConfidenceLabel(confidence) {
  const value = Number(confidence);
  const level = value >= 80 ? "高" : value >= 70 ? "中高" : "中";
  return `信頼度: ${level} (${value})`;
}

function buildWhyNow(opportunity) {
  const evidence = Array.isArray(opportunity.monetizationEvidence) ? opportunity.monetizationEvidence.length : 0;
  const signals = Array.isArray(opportunity.supportingSignalIds) ? opportunity.supportingSignalIds.length : 0;
  if (signals > 0 && evidence > 0) {
    return `Mock Signal ${signals}件と収益根拠 ${evidence}件に基づく候補です。`;
  }
  return "Mock Signalの評価結果に基づく候補です。";
}

function buildMainRisk(opportunity) {
  const risks = Array.isArray(opportunity.riskFlags) ? opportunity.riskFlags : [];
  const medium = risks.find((risk) => String(risk).toLowerCase().includes("medium"));
  const first = medium || risks[0];
  return first ? displayText(first, RISK_LABELS, "確認が必要なリスク") : "重大なリスクは検出されていません（Mock評価）。";
}

function buildNextAction(opportunity) {
  const laneLabel = LANE_LABELS[opportunity.lane] || "市場";
  return `${laneLabel}候補として根拠を確認`;
}

function displayText(value, dictionary, fallback = null) {
  if (value === undefined || value === null || value === "") return fallback || "要確認";
  return dictionary[value] || fallback || value;
}

function displayList(values = [], dictionary) {
  return values.map((value) => displayText(value, dictionary));
}

function formatDateTokyo(value) {
  const time = Date.parse(value || "");
  if (!Number.isFinite(time)) return "要確認";
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Tokyo",
  }).format(new Date(time));
}

function summarizeProvenance(provenance) {
  if (!isPlainObject(provenance) || !Array.isArray(provenance.sourceNames)) return [];
  return provenance.sourceNames.map((sourceName) => displayText(sourceName, PROVENANCE_LABELS));
}

function buildRecommendation(opportunity, rank) {
  const forecast = opportunity.forecastRevenueRange;
  return {
    rank,
    opportunityId: opportunity.opportunityId,
    opportunityVersion: opportunity.opportunityVersion,
    marketId: opportunity.marketId,
    correlationId: opportunity.correlationId,
    lane: opportunity.lane,
    primary: {
      title: `${displayText(opportunity.title, MARKET_TITLE_LABELS)}（${LANE_LABELS[opportunity.lane]}）`,
      whyNow: buildWhyNow(opportunity),
      forecastLabel: buildForecastLabel(forecast),
      forecastRange: {
        currency: forecast.currency,
        low: forecast.low,
        base: forecast.base,
        high: forecast.high,
        periodDays: forecast.periodDays,
      },
      confidenceLabel: buildConfidenceLabel(opportunity.adjustedConfidence),
      adjustedConfidence: opportunity.adjustedConfidence,
      mainRisk: buildMainRisk(opportunity),
      nextAction: buildNextAction(opportunity),
      expiresAt: formatDateTokyo(opportunity.expiresAt),
    },
    details: {
      customerProblem: displayText(opportunity.customerProblem, CUSTOMER_PROBLEM_LABELS),
      targetAudience: displayText(opportunity.targetAudience, TARGET_AUDIENCE_LABELS),
      revenueModel: displayText(opportunity.revenueModel, VALUE_LABELS),
      recommendedChannel: displayText(opportunity.recommendedChannel, VALUE_LABELS),
      finalScore: opportunity.finalScore,
      baseScore: opportunity.baseScore,
      totalPenalty: opportunity.totalPenalty,
      estimatedTimeToRevenue: opportunity.estimatedTimeToRevenue,
      assumptions: Array.isArray(forecast.assumptions) ? displayList(forecast.assumptions, ASSUMPTION_LABELS) : [],
      supportingSignalCount: Array.isArray(opportunity.supportingSignalIds) ? opportunity.supportingSignalIds.length : 0,
      sourceTypeCount: new Set((opportunity.signals || []).map((signal) => signal.sourceType).filter(Boolean)).size,
      monetizationEvidence: Array.isArray(opportunity.monetizationEvidence) ? displayList(opportunity.monetizationEvidence, EVIDENCE_LABELS) : [],
      riskFlags: Array.isArray(opportunity.riskFlags) ? displayList(opportunity.riskFlags, RISK_LABELS) : [],
      provenanceSummary: summarizeProvenance(opportunity.provenance),
    },
    safety: {
      dataMode: DATA_MODES.MOCK,
      isMock: true,
      productionExecution: false,
      externalExecution: false,
      confirmedRevenueAvailable: false,
      ownerDecisionEnabled: true,
      campaignHandoffEnabled: false,
    },
  };
}

function countBlocked(opportunities = []) {
  const summary = new Map();
  let holdCount = 0;
  let rejectedCount = 0;
  let expiredCount = 0;

  for (const opportunity of opportunities) {
    const result = opportunity?.validation?.result;
    const reasonCodes = opportunity?.validation?.reasonCodes || [];
    if (result === GATE_RESULTS.HOLD) holdCount += 1;
    if (result === GATE_RESULTS.REJECT) rejectedCount += 1;
    if (reasonCodes.includes(GATE_REASON_CODES.SIGNAL_EXPIRED) || opportunity?.state === "expired") expiredCount += 1;
    for (const reasonCode of reasonCodes) {
      summary.set(reasonCode, (summary.get(reasonCode) || 0) + 1);
    }
  }

  return {
    holdCount,
    rejectedCount,
    expiredCount,
    reasonSummary: [...summary.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([reasonCode, count]) => ({
      reasonCode,
      count,
      ownerMessage: BLOCKED_REASON_MESSAGES[reasonCode] || "確認が必要な候補があります。",
    })),
  };
}

function createFallbackViewModel(status, evaluationTime, errors = [], foundationResult = {}) {
  const safeFoundation = isPlainObject(foundationResult) ? foundationResult : {};
  const opportunities = Array.isArray(safeFoundation.opportunities) ? safeFoundation.opportunities : [];
  return {
    ok: false,
    status,
    schemaVersion: safeFoundation.schemaVersion || MARKET_INTELLIGENCE_SCHEMA_VERSION,
    dataMode: DATA_MODES.MOCK,
    isMock: true,
    evaluationTime: evaluationTime || null,
    briefing: {
      title: "Market Intelligence",
      summary: "安全に表示できる市場候補はありません。",
      oneNextAction: "Mock Signalを確認してください。",
      recommendationCount: 0,
      hasAssetCandidate: false,
      assetFallbackUsed: false,
      assetFallbackReason: null,
    },
    recommendations: [],
    blocked: countBlocked(opportunities),
    errors,
  };
}

function createBriefing(recommendations, opportunities) {
  const passAssetCandidates = opportunities.filter((opportunity) => opportunity?.validation?.result === GATE_RESULTS.PASS && opportunity.lane === LANES.ASSET);
  const hasAssetCandidate = recommendations.some((recommendation) => recommendation.lane === LANES.ASSET);
  const assetFallbackUsed = recommendations.length === 3 && recommendations.every((recommendation) => recommendation.lane === LANES.CASH) && passAssetCandidates.length === 0;
  return {
    title: "本日の市場判断",
    summary: recommendations.length
      ? `Owner判断に回せる市場候補が${recommendations.length}件あります。実売上は未接続です。`
      : "本日の市場判断に重要な変化はありません。",
    oneNextAction: recommendations.length ? "最上位候補を確認してください。" : "追加判断は不要です。",
    recommendationCount: recommendations.length,
    hasAssetCandidate,
    assetFallbackUsed,
    assetFallbackReason: assetFallbackUsed ? "資産形成レーンにHard Gate通過候補がないため、短期収益候補のみ表示しています。" : null,
  };
}

export function buildMarketIntelligenceViewModel(foundationResult, evaluationTime) {
  const foundationValidation = validateFoundationResult(foundationResult, evaluationTime);
  const normalizedEvaluationTime = foundationValidation.evaluationTime;
  if (foundationValidation.errors.length) {
    return createFallbackViewModel("rejected", normalizedEvaluationTime, foundationValidation.errors, foundationResult);
  }

  const top3 = foundationResult.top3;
  if (!top3.length) {
    return createFallbackViewModel("empty", normalizedEvaluationTime, [], foundationResult);
  }

  const validationErrors = [];
  const validationHolds = [];
  top3.forEach((opportunity, index) => {
    const validation = validateRecommendation(opportunity, normalizedEvaluationTime);
    validationErrors.push(...validation.errors.map((error) => ({ ...error, field: `top3.${index}.${error.field}` })));
    validationHolds.push(...validation.holds.map((error) => ({ ...error, field: `top3.${index}.${error.field}` })));
  });

  if (validationErrors.length) {
    return createFallbackViewModel("rejected", normalizedEvaluationTime, validationErrors, foundationResult);
  }
  if (validationHolds.length) {
    return createFallbackViewModel("hold", normalizedEvaluationTime, validationHolds, foundationResult);
  }

  const recommendations = top3.map((opportunity, index) => buildRecommendation(opportunity, index + 1));
  return {
    ok: true,
    status: "ready",
    schemaVersion: foundationResult.schemaVersion,
    dataMode: DATA_MODES.MOCK,
    isMock: true,
    evaluationTime: normalizedEvaluationTime,
    briefing: createBriefing(recommendations, foundationResult.opportunities),
    recommendations,
    blocked: countBlocked(foundationResult.opportunities),
    errors: [],
  };
}
