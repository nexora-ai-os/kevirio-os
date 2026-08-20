export const AI_BUDGET_OPTIONS = Object.freeze([0, 500, 1000, 3000, "custom"]);
export const AI_ROUTER_POLICY = Object.freeze({ defaultProvider: "gemini", defaultState: "FREE_TIER_UNVERIFIED", fallback: "deterministic_local", paidFallback: false, budgetMode: "FREE_ONLY", monthlyBudgetJpy: 0, privacy: "PERSONAL_PRIVATE", truthClasses: Object.freeze(["ACTUAL", "FORECAST", "UNKNOWN", "INFERENCE", "MOCK", "TEST"]), externalExecution: "LOCKED" });
export const AI_AREA_CAPABILITIES = Object.freeze({
  home: "今日の優先順位と次の一手を整理", assistant: "許可された情報だけで相談を整理", goals: "目標分解・週間優先順位・リスク確認", sns: "投稿案・フック・手動公開カレンダー", snsAnalytics: "登録済みActual指標の解釈", content: "brief・タイトル・CTA・校正", note: "構成・タイトル・要約・推敲", affiliate: "Program比較・優先順位・content angle・compliance review", opportunities: "適合度・要件抽出・リスク整理", outreach: "提案文・follow-up下書き", projects: "task分解・期限計画・blocker検出", studio: "brief解釈・QA・修正提案", revenueCenter: "Actual/Forecastを分離した傾向説明", crm: "顧客要約・次のfollow-up候補", employees: "分担・下書き・準備・推奨", team: "TEAM-visible情報だけの要約", knowledge: "検索・要約・学び抽出", analytics: "利用可能なActualだけの解説", feedback: "分類・重複候補・優先順位・impact案", connectors: "Provider状態・scope・接続問題の説明", safety: "security・cost eventの要約", settings: "AI provider・budget・privacy設定の説明",
});
const forbidden = /\b(?:api[_-]?key|access[_-]?token|refresh[_-]?token|password|authorization)\b/i;
export function buildAiRequestContract(input = {}) {
  const text = String(input.text || "").trim(), feature = String(input.feature || "").trim();
  if (!input.authenticatedUserId || !input.workspaceId) throw new Error("AI_IDENTITY_CONTEXT_REQUIRED");
  if (!AI_AREA_CAPABILITIES[feature]) throw new Error("AI_FEATURE_NOT_ALLOWED");
  if (!text || text.length > 4000) throw new Error("AI_INPUT_INVALID");
  if (forbidden.test(text)) throw new Error("AI_PRIVATE_CONTEXT_BLOCKED");
  return Object.freeze({ authenticatedUserId: input.authenticatedUserId, workspaceId: input.workspaceId, feature, purpose: AI_AREA_CAPABILITIES[feature], providerPreference: "gemini", privacyClassification: "PERSONAL_PRIVATE", truthRequirements: Object.freeze(["UNKNOWN_NOT_ZERO", "FORECAST_NOT_ACTUAL", "AI_NOT_EVIDENCE"]), maxInput: 4000, maxOutput: 800, costPolicy: "FREE_ONLY", selectedContextOnly: true, text });
}
export function routeAiRequest(contract, { geminiFreeEligibilityVerified = false } = {}) {
  if (!contract?.workspaceId) return Object.freeze({ provider: "none", state: "BLOCKED", reasonCode: "AI_REQUEST_INVALID", costClassification: "FREE", externalAction: false });
  if (geminiFreeEligibilityVerified === true) return Object.freeze({ provider: "gemini", model: "gemini-2.5-flash", state: "CONNECTED_FREE", costClassification: "FREE", paidFallback: false, externalAction: false });
  return Object.freeze({ provider: "local-deterministic", model: null, state: "FREE_TIER_UNVERIFIED", reasonCode: "GEMINI_FREE_ELIGIBILITY_UNVERIFIED", costClassification: "FREE", paidFallback: false, externalAction: false });
}
