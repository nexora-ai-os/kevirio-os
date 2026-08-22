const DOMAINS = new Set(["GLOBAL","MARKET","TREND","COMPETITOR","OPPORTUNITY","AFFILIATE","CONTENT","WORK","REGULATION"]);
const SOURCE_TYPES = new Set(["OFFICIAL_GOVERNMENT","OFFICIAL_COMPANY","PROVIDER_OFFICIAL","NEWS","MARKETPLACE","PUBLIC_SOCIAL","PUBLIC_COMMUNITY","SEARCH_SIGNAL","OTHER_WEB"]);
const RELIABILITY = new Set(["PRIMARY","HIGH","MEDIUM","LOW","UNKNOWN"]);
const TRUTH = new Set(["WEB_SOURCE","CONNECTED_DATA","AI_INFERENCE","AI_RECOMMENDATION"]);
const COST = new Set(["FREE_CONFIRMED","FREE_LIMITED"]);
const TARGETS = new Set(["GOAL","STRATEGY","WORK","APPLICATION","CLIENT","CONTENT","SNS_ITEM","KNOWLEDGE","IMPROVEMENT","AFFILIATE_PROGRAM"]);
const SECRET = /(api[_ -]?key|access[_ -]?token|refresh[_ -]?token|authorization|bearer\s+|password\s*[=:]|client[_ -]?secret|service[_ -]?role|private[_ -]?key)/i;
const clean = (value, max) => String(value ?? "").trim().slice(0, max);

export function validateResearchExecution(input = {}) {
  const source = input.source || {}, findings = Array.isArray(input.findings) ? input.findings : [], links = Array.isArray(input.links) ? input.links : [];
  const errors = [];
  let url;
  try { url = new URL(source.canonicalUrl); if (url.protocol !== "https:" || url.username || url.password) errors.push("SOURCE_URL_INVALID"); } catch { errors.push("SOURCE_URL_INVALID"); }
  if (!COST.has(source.costClass)) errors.push("SOURCE_COST_DENIED");
  if (!SOURCE_TYPES.has(source.sourceType) || !RELIABILITY.has(source.reliabilityClass)) errors.push("SOURCE_CLASS_INVALID");
  if (!clean(source.sourceName, 300) || !/^[a-z0-9.-]{1,253}$/.test(clean(source.sourceDomain, 253).toLowerCase())) errors.push("SOURCE_IDENTITY_INVALID");
  if (!findings.length || findings.length > 8) errors.push("FINDING_COUNT_INVALID");
  for (const finding of findings) {
    if (!DOMAINS.has(finding.domain) || !TRUTH.has(finding.truthClass)) errors.push("FINDING_CLASS_INVALID");
    if (!clean(finding.statement, 8000) || SECRET.test(String(finding.statement || ""))) errors.push("FINDING_TEXT_INVALID");
    const confidence = finding.confidence == null ? null : Number(finding.confidence);
    if (confidence != null && (!Number.isFinite(confidence) || confidence < 0 || confidence > 1)) errors.push("FINDING_CONFIDENCE_INVALID");
    if (!finding.observedAt || Number.isNaN(Date.parse(finding.observedAt))) errors.push("FINDING_OBSERVED_AT_INVALID");
    if (!finding.provenance || typeof finding.provenance !== "object" || Array.isArray(finding.provenance) || !Object.keys(finding.provenance).length || SECRET.test(JSON.stringify(finding.provenance))) errors.push("FINDING_PROVENANCE_INVALID");
  }
  for (const link of links) if (!TARGETS.has(link.targetType) || !/^[0-9a-f-]{36}$/i.test(String(link.targetId || ""))) errors.push("LINK_TARGET_INVALID");
  return { ok: errors.length === 0, errors: [...new Set(errors)], source: { canonicalUrl: url?.toString(), sourceName: clean(source.sourceName,300), sourceDomain: clean(source.sourceDomain,253).toLowerCase(), countryCode: source.countryCode || null, region: clean(source.region,120) || null, sourceType: source.sourceType, reliabilityClass: source.reliabilityClass, costClass: source.costClass, limitations: clean(source.limitations,2000) || null }, findings: findings.slice(0,8), links: links.slice(0,20) };
}
