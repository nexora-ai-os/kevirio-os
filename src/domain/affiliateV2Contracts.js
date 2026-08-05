import { ALERT_SEVERITIES, COMPLIANCE_STATES, TRUTH_CLASSES } from "./affiliateIntelligenceV2.js";

export const AFFILIATE_V2_MAX_ROWS = 100;
export const AFFILIATE_V2_ERROR_CODES = Object.freeze(["AUTH_REQUIRED","OWNER_REQUIRED","WORKSPACE_FORBIDDEN","NOT_FOUND","VALIDATION_FAILED","CONFLICT","IDEMPOTENCY_CONFLICT","RPC_UNAVAILABLE","DATABASE_ERROR","PROVIDER_LOCKED","NOT_CONFIGURED","LOCKED","RATE_LIMITED","PROVIDER_ERROR","UNKNOWN"]);

export class AffiliateV2Error extends Error {
  constructor(code, context = {}) {
    super(code); this.name = "AffiliateV2Error"; this.code = AFFILIATE_V2_ERROR_CODES.includes(code) ? code : "UNKNOWN";
    this.context = Object.freeze({ operation: String(context.operation || "unknown"), object: String(context.object || "unknown") });
  }
}

const text = (value) => value == null ? null : String(value).trim();
const date = (value, field, object) => {
  if (value == null) return null;
  const parsed = new Date(value); if (Number.isNaN(parsed.valueOf())) throw new AffiliateV2Error("VALIDATION_FAILED", { operation: `invalid_${field}`, object });
  return parsed.toISOString();
};
const number = (value, field, object, min, max) => {
  if (value == null) return null; const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) throw new AffiliateV2Error("VALIDATION_FAILED", { operation: `invalid_${field}`, object });
  return parsed;
};
const truth = (value, object) => {
  const result = value || "Unknown"; if (!TRUTH_CLASSES.includes(result)) throw new AffiliateV2Error("VALIDATION_FAILED", { operation: "invalid_truth_class", object }); return result;
};
const safeObject = (value, object) => {
  if (value == null) return Object.freeze({});
  if (typeof value !== "object" || Array.isArray(value)) throw new AffiliateV2Error("VALIDATION_FAILED", { operation: "invalid_safe_json", object });
  const serialized = JSON.stringify(value); if (serialized.length > 32768 || /(token|secret|password|credential|authorization|cookie|raw_provider_payload)/i.test(serialized)) throw new AffiliateV2Error("VALIDATION_FAILED", { operation: "unsafe_json", object });
  return Object.freeze({ ...value });
};
const required = (row, field, object) => { if (!row?.[field]) throw new AffiliateV2Error("VALIDATION_FAILED", { operation: `missing_${field}`, object }); return row[field]; };
const base = (row, object) => ({ id: required(row,"id",object), workspaceId: required(row,"workspace_id",object), createdAt: date(row.created_at,"created_at",object), updatedAt: date(row.updated_at,"updated_at",object), archivedAt: date(row.archived_at,"archived_at",object) });

export const mapProductRow = (row) => Object.freeze({ ...base(row,"affiliate_products"), programId: required(row,"affiliate_program_id","affiliate_products"), name: text(required(row,"name","affiliate_products")), modelName:text(row.model_name), priceMinor:number(row.price_minor,"price_minor","affiliate_products",0,Number.MAX_SAFE_INTEGER), currency:text(row.currency), status:text(row.lifecycle_status), truthClass:truth(row.truth_class,"affiliate_products"), confidence:number(row.confidence,"confidence","affiliate_products",0,1), sourceReference:text(row.source_reference), evidenceCandidateId:text(row.evidence_candidate_id), metadata:safeObject(row.safe_metadata,"affiliate_products") });
export const mapProductSourceRow = (row) => Object.freeze({ ...base(row,"affiliate_product_sources"), productId:required(row,"product_id","affiliate_product_sources"), sourceType:text(required(row,"source_type","affiliate_product_sources")), sourceReference:text(required(row,"source_reference","affiliate_product_sources")), attribution:text(required(row,"attribution","affiliate_product_sources")), observedAt:date(row.observed_at,"observed_at","affiliate_product_sources"), status:text(row.lifecycle_status), evidenceCandidateId:text(row.evidence_candidate_id) });
export const mapResearchRow = (row) => { const type=text(required(row,"entity_type","affiliate_research_entities")); if(!["audience","competitor","keyword"].includes(type)) throw new AffiliateV2Error("VALIDATION_FAILED",{operation:"invalid_entity_type",object:"affiliate_research_entities"}); return Object.freeze({ ...base(row,"affiliate_research_entities"), programId:required(row,"affiliate_program_id","affiliate_research_entities"), entityType:type, name:text(required(row,"name","affiliate_research_entities")), status:text(row.lifecycle_status), truthClass:truth(row.truth_class,"affiliate_research_entities"), confidence:number(row.confidence,"confidence","affiliate_research_entities",0,1), sourceReference:text(row.source_reference), attributes:safeObject(row.attributes,"affiliate_research_entities") }); };
export const mapExperimentRow = (row) => Object.freeze({ ...base(row,"affiliate_experiments"), programId:required(row,"affiliate_program_id","affiliate_experiments"), title:text(required(row,"title","affiliate_experiments")), hypothesis:text(required(row,"hypothesis","affiliate_experiments")), status:text(row.lifecycle_status), resultTruthClass:truth(row.result_truth_class,"affiliate_experiments"), resultSummary:text(row.result_summary), approvalRequestId:text(row.approval_request_id), evidenceCandidateId:text(row.evidence_candidate_id) });
export const mapSnapshotRow = (row) => { const result=Object.freeze({ ...base(row,"affiliate_intelligence_snapshots"), programId:required(row,"affiliate_program_id","affiliate_intelligence_snapshots"), snapshotType:text(required(row,"snapshot_type","affiliate_intelligence_snapshots")), version:number(row.version,"version","affiliate_intelligence_snapshots",1,Number.MAX_SAFE_INTEGER), status:text(row.lifecycle_status), truthClass:truth(row.truth_class,"affiliate_intelligence_snapshots"), generatedAt:date(row.generated_at,"generated_at","affiliate_intelligence_snapshots"), sourceReference:text(required(row,"source_reference","affiliate_intelligence_snapshots")), assumptions:Object.freeze([...(row.assumptions||[])]), confidence:number(row.confidence,"confidence","affiliate_intelligence_snapshots",0,1), modelVersion:text(required(row,"model_version","affiliate_intelligence_snapshots")), payload:safeObject(row.payload,"affiliate_intelligence_snapshots") }); if(result.truthClass==="Actual") throw new AffiliateV2Error("VALIDATION_FAILED",{operation:"actual_snapshot_forbidden",object:"affiliate_intelligence_snapshots"}); return result; };
export const mapRiskRow = (row) => { if(!COMPLIANCE_STATES.includes(row.classification)) throw new AffiliateV2Error("VALIDATION_FAILED",{operation:"invalid_classification",object:"affiliate_risk_findings"}); return Object.freeze({ ...base(row,"affiliate_risk_findings"), programId:required(row,"affiliate_program_id","affiliate_risk_findings"), snapshotId:text(row.snapshot_id), type:text(required(row,"finding_type","affiliate_risk_findings")), classification:row.classification, title:text(required(row,"title","affiliate_risk_findings")), rationale:text(required(row,"rationale","affiliate_risk_findings")), sourceReference:text(row.source_reference), status:text(row.lifecycle_status), ownerDecisionId:text(row.owner_decision_id) }); };
export const mapAlertRow = (row) => { if(!ALERT_SEVERITIES.includes(row.severity)) throw new AffiliateV2Error("VALIDATION_FAILED",{operation:"invalid_severity",object:"affiliate_alerts"}); return Object.freeze({ ...base(row,"affiliate_alerts"), programId:required(row,"affiliate_program_id","affiliate_alerts"), riskFindingId:text(row.risk_finding_id), severity:row.severity, code:text(required(row,"alert_code","affiliate_alerts")), summary:text(required(row,"summary","affiliate_alerts")), status:text(row.lifecycle_status), detectedAt:date(row.detected_at,"detected_at","affiliate_alerts"), resolvedAt:date(row.resolved_at,"resolved_at","affiliate_alerts") }); };
export const mapBriefRow = (row) => Object.freeze({ ...base(row,"affiliate_daily_briefs"), briefDate:text(required(row,"brief_date","affiliate_daily_briefs")), ruleVersion:text(required(row,"rule_version","affiliate_daily_briefs")), actionCount:number(row.action_count,"action_count","affiliate_daily_briefs",0,3), decisionIds:Object.freeze([...(row.decision_ids||[])]), summary:safeObject(row.summary,"affiliate_daily_briefs"), truthClass:truth(row.truth_class,"affiliate_daily_briefs"), generatedAt:date(row.generated_at,"generated_at","affiliate_daily_briefs") });
export const mapAssetRow = (row) => Object.freeze({ ...base(row,"reusable_business_assets"), sourceContentAssetId:text(row.source_content_asset_id), assetType:text(required(row,"asset_type","reusable_business_assets")), title:text(required(row,"title","reusable_business_assets")), version:text(required(row,"version","reusable_business_assets")), maturity:text(row.maturity), ownership:text(row.ownership)||"Unknown", licenseClassification:text(row.license_classification)||"unknown", internalReuse:row.internal_reuse===true, exportReady:false, publicMarketplace:false, paymentEnabled:false, contentReference:text(row.content_reference), metadata:safeObject(row.safe_metadata,"reusable_business_assets") });

export function mapRepositoryError(error, context={}) {
  if(error instanceof AffiliateV2Error) return error;
  const code=String(error?.code||""); const message=String(error?.message||"").toLowerCase();
  if(code==="PGRST116") return new AffiliateV2Error("NOT_FOUND",context);
  if(code==="23505") return new AffiliateV2Error(message.includes("idempotency")?"IDEMPOTENCY_CONFLICT":"CONFLICT",context);
  if(message.includes("owner_authentication_required")) return new AffiliateV2Error("AUTH_REQUIRED",context);
  if(message.includes("workspace_owner_access_denied")) return new AffiliateV2Error("WORKSPACE_FORBIDDEN",context);
  if(message.includes("could not find")||message.includes("rpc")) return new AffiliateV2Error("RPC_UNAVAILABLE",context);
  return new AffiliateV2Error("DATABASE_ERROR",context);
}

export function normalizeLimit(value) { const parsed=Number(value??50); return Number.isInteger(parsed)&&parsed>0?Math.min(parsed,AFFILIATE_V2_MAX_ROWS):50; }
