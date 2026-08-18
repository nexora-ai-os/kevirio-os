export const ASSISTANT_INTENTS = Object.freeze({ TODAY: "today", BUSINESS_IDEA: "business_idea", MONETIZATION: "monetization", THREADS_CONTENT: "threads_content", OPPORTUNITY_REVIEW: "opportunity_review", REVENUE_REVIEW: "revenue_review", PROPOSAL: "proposal", GENERAL: "general" });

const RULES = Object.freeze([
  [ASSISTANT_INTENTS.THREADS_CONTENT, /threads|投稿|ポスト|sns.{0,4}(作|書)/i],
  [ASSISTANT_INTENTS.OPPORTUNITY_REVIEW, /crowdworks|クラウドワークス|案件.{0,5}(評価|見|探)|仕事.{0,3}探/i],
  [ASSISTANT_INTENTS.PROPOSAL, /提案(書|資料|文)|応募文|営業文/i],
  [ASSISTANT_INTENTS.MONETIZATION, /収益化|あと.{0,8}万|売上.{0,8}(増|上)|稼/i],
  [ASSISTANT_INTENTS.REVENUE_REVIEW, /収益|売上|未入金|利益|経費/i],
  [ASSISTANT_INTENTS.BUSINESS_IDEA, /事業.{0,4}(アイデア|相談)|アイデア.{0,4}(どう|評価)/i],
  [ASSISTANT_INTENTS.TODAY, /今日.{0,8}(何|なに|やる|したら)|次.{0,3}(何|なに)/i],
]);

export function normalizeAssistantInput(value) { return String(value || "").normalize("NFKC").trim().replace(/\s+/g, " ").slice(0, 2000); }
export function classifyAssistantIntent(value) { const input=normalizeAssistantInput(value); return RULES.find(([,pattern])=>pattern.test(input))?.[0] || ASSISTANT_INTENTS.GENERAL; }
