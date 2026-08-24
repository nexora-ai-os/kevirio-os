const clean = value => String(value ?? "").replace(/\s+/g, " ").trim();
const UNKNOWN = "未記録";

const SECTION_PATTERNS = Object.freeze({
  purpose: ["調査目的", "目的"],
  targetAudience: ["ターゲット", "対象ユーザー", "audience"],
  marketNeed: ["市場ニーズ", "market need"],
  competitor: ["競合", "competitor"],
  opportunity: ["機会", "opportunity"],
  risks: ["リスク", "risks"],
  recommendedAngle: ["推奨訴求", "訴求", "recommended angle"],
  recommendedChannel: ["推奨チャネル", "recommended channel"],
  nextAction: ["次のアクション", "次の行動", "next action"],
});

const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function section(statement, labels) {
  for (const label of labels) {
    const pattern = new RegExp(`(?:^|\\n)\\s*(?:#{1,6}\\s*)?(?:\\*\\*)?${escape(label)}(?:\\*\\*)?\\s*[:：]?\\s*([\\s\\S]*?)(?=\\n\\s*(?:#{1,6}\\s*)?(?:\\*\\*)?[^\\n]{1,40}(?:\\*\\*)?\\s*[:：]\\s*|$)`, "im");
    const match = String(statement || "").match(pattern);
    if (clean(match?.[1])) return match[1].trim();
  }
  return UNKNOWN;
}

export function projectAffiliateResearchFinding(finding = {}) {
  const statement = String(finding.statement || "").trim();
  const provenance = finding.provenance && typeof finding.provenance === "object" ? finding.provenance : {};
  return Object.freeze({
    id: finding.id,
    type: finding.research_domain || UNKNOWN,
    executedAt: finding.retrieved_at || finding.observed_at || null,
    source: provenance.source_url || finding.research_source?.source_name || finding.research_source?.source_domain || UNKNOWN,
    truthClass: finding.truth_class || UNKNOWN,
    confidence: finding.confidence == null ? null : Number(finding.confidence),
    summary: clean(statement).slice(0, 180) || UNKNOWN,
    purpose: section(statement, SECTION_PATTERNS.purpose),
    findings: statement || UNKNOWN,
    targetAudience: section(statement, SECTION_PATTERNS.targetAudience),
    marketNeed: section(statement, SECTION_PATTERNS.marketNeed),
    competitor: section(statement, SECTION_PATTERNS.competitor),
    opportunity: section(statement, SECTION_PATTERNS.opportunity),
    risks: section(statement, SECTION_PATTERNS.risks),
    recommendedAngle: section(statement, SECTION_PATTERNS.recommendedAngle),
    recommendedChannel: section(statement, SECTION_PATTERNS.recommendedChannel),
    nextAction: section(statement, SECTION_PATTERNS.nextAction),
    provenance: Object.freeze({ ...provenance }),
    factVsInference: finding.truth_class === "WEB_SOURCE" || finding.truth_class === "CONNECTED_DATA" ? "FACT / SOURCE-BASED" : "INFERENCE / AI OUTPUT · NOT EVIDENCE",
  });
}
