import { mockMarketSignals } from "../data/mockMarketSignals.js";
import { buildMarketIntelligenceFoundation } from "./marketIntelligenceEngine.js";

const FOUNDATION_EVALUATION_TIME = new Date("2026-07-14T01:00:00.000Z");

export function buildProductionCandidatePreview() {
  const recommendation = buildMarketIntelligenceFoundation(mockMarketSignals, FOUNDATION_EVALUATION_TIME).top3[0];
  return {
    sourceSignalId: recommendation.opportunityId,
    title: recommendation.title,
    summary: `${recommendation.customerProblem} / ${recommendation.targetAudience}`,
    lane: recommendation.revenueModel === "lead" ? "service" : recommendation.revenueModel,
    channel: recommendation.recommendedChannel,
    dataMode: recommendation.dataMode,
    freshnessAt: recommendation.createdAt,
    expiresAt: recommendation.expiresAt,
    forecastCurrency: recommendation.forecastRevenueRange.currency,
    forecastRevenueMinor: recommendation.forecastRevenueRange.base,
    forecastCostMinor: recommendation.requiredCost,
    scoreSnapshot: { finalScore: recommendation.finalScore, baseScore: recommendation.baseScore },
    confidenceSnapshot: { adjustedConfidence: recommendation.adjustedConfidence },
    riskSnapshot: { legalPolicyRisk: recommendation.legalPolicyRisk, flags: recommendation.riskFlags },
    provenance: {
      sourceNames: recommendation.provenance.sourceNames,
      supportingSignalIds: recommendation.supportingSignalIds,
      isMock: true,
      schemaVersion: recommendation.schemaVersion,
    },
    offer: {
      title: recommendation.title.endsWith("提案") ? recommendation.title : `${recommendation.title} 提案`,
      audience: recommendation.targetAudience,
      validationBudgetMinor: recommendation.validationBudget,
      estimatedTimeToRevenueDays: recommendation.estimatedTimeToRevenue,
    },
    artifact: {
      title: recommendation.title,
      purpose: "Owner review before any manual external action",
      customerProblem: recommendation.customerProblem,
      channel: recommendation.recommendedChannel,
      disclosure: "MOCK market intelligence; forecast only; no actual revenue claim.",
      externalExecutionAllowed: false,
    },
  };
}

export function candidateIdempotencyKey(candidate) {
  return `market:${candidate.sourceSignalId}:v1`;
}
