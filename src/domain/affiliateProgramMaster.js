import { AffiliateV2Error } from "./affiliateV2Contracts.js";

export const LISTING_VERIFICATION_STATES = Object.freeze(["CONFIRMED", "NOT_CONFIRMED", "NONE_CONFIRMED", "UNKNOWN"]);
export const AFFILIATE_LINK_STATES = Object.freeze(["NOT_REGISTERED", "ACTIVE", "PAUSED", "EXPIRED", "INVALID"]);
export const AFFILIATE_PROGRAM_STATES = Object.freeze(["ACTIVE", "PAUSED", "ARCHIVED", "EXPIRED", "UNKNOWN"]);
export const AFFILIATE_PROGRAM_EDIT_FIELDS = Object.freeze(["aspName", "programId", "advertiserName", "programName", "category", "rewardSummary", "conversionConditions", "rejectionConditions", "complianceNotes", "sourceNotes", "ownerNotes", "programStatus"]);
export const AFFILIATE_PROGRAM_PRACTICAL_FIELDS = Object.freeze(["aspName","programId","advertiserName","programName","category","rewardType","rewardSummary","rewardDetails","epc","approvalRate","revisitWindowDays","confirmationDays","conversionConditions","rejectionConditions","prPoints","listingPolicy","listingNgWords","listingNgWordsRaw","listingVerificationStatus","complianceNotes","sourceType","sourceVerifiedAt","sourceNotes","ownerNotes"]);

const text = (value) => value == null ? null : String(value).trim();

export function normalizeAffiliateLink(input = {}) {
  const affiliateUrl = text(input.affiliateUrl);
  if (!affiliateUrl) return Object.freeze({ affiliateUrl: null, linkStatus: "NOT_REGISTERED" });
  let parsed;
  try { parsed = new URL(affiliateUrl); } catch { throw new AffiliateV2Error("VALIDATION_FAILED", { operation: "invalid_affiliate_url", object: "affiliate_program_master" }); }
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new AffiliateV2Error("VALIDATION_FAILED", { operation: "invalid_affiliate_url_scheme", object: "affiliate_program_master" });
  const linkStatus = text(input.linkStatus) || "ACTIVE";
  if (!AFFILIATE_LINK_STATES.includes(linkStatus) || linkStatus === "NOT_REGISTERED" || linkStatus === "INVALID") throw new AffiliateV2Error("VALIDATION_FAILED", { operation: "invalid_affiliate_link_status", object: "affiliate_program_master" });
  return Object.freeze({ affiliateUrl, linkStatus });
}

export function normalizeAffiliateProgramUpdate(input = {}) {
  if (!input.expectedUpdatedAt || Number.isNaN(new Date(input.expectedUpdatedAt).valueOf())) throw new AffiliateV2Error("VALIDATION_FAILED", { operation: "expected_updated_at_required", object: "affiliate_program_master" });
  const changes = {};
  for (const field of AFFILIATE_PROGRAM_EDIT_FIELDS) if (Object.prototype.hasOwnProperty.call(input.changes || {}, field)) changes[field.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)] = text(input.changes[field]);
  if (!Object.keys(changes).length) throw new AffiliateV2Error("VALIDATION_FAILED", { operation: "changes_required", object: "affiliate_program_master" });
  if (changes.program_status && !AFFILIATE_PROGRAM_STATES.includes(changes.program_status)) throw new AffiliateV2Error("VALIDATION_FAILED", { operation: "invalid_program_status", object: "affiliate_program_master" });
  return Object.freeze({ expectedUpdatedAt: new Date(input.expectedUpdatedAt).toISOString(), changes: Object.freeze(changes) });
}

export function normalizeAffiliateProgramPracticalUpdate(input={}){
  if(!input.expectedUpdatedAt||!Number.isInteger(Number(input.expectedBusinessVersion))||Number(input.expectedBusinessVersion)<1)throw new AffiliateV2Error("VALIDATION_FAILED",{operation:"practical_version_required",object:"affiliate_program_master"});
  const changes={};for(const field of AFFILIATE_PROGRAM_PRACTICAL_FIELDS)if(Object.prototype.hasOwnProperty.call(input.changes||{},field)){const key=field.replace(/[A-Z]/g,l=>`_${l.toLowerCase()}`);const value=input.changes[field];changes[key]=typeof value==="string"?value.trim():value}
  if(!Object.keys(changes).length)throw new AffiliateV2Error("VALIDATION_FAILED",{operation:"practical_changes_required",object:"affiliate_program_master"});
  return Object.freeze({expectedUpdatedAt:new Date(input.expectedUpdatedAt).toISOString(),expectedBusinessVersion:Number(input.expectedBusinessVersion),changes:Object.freeze(changes)});
}

export function mapAffiliateProgramMasterRow(row) {
  if (!row?.id || !row.workspace_id || !row.asp_name || !row.program_id || !row.program_name) throw new AffiliateV2Error("VALIDATION_FAILED", { operation: "missing_required_field", object: "affiliate_program_master" });
  const verification = text(row.listing_ng_words_verification_status) || "UNKNOWN";
  if (!LISTING_VERIFICATION_STATES.includes(verification)) throw new AffiliateV2Error("VALIDATION_FAILED", { operation: "invalid_listing_verification", object: "affiliate_program_master" });
  const words = row.listing_ng_words == null ? null : Object.freeze([...row.listing_ng_words]);
  if (verification === "NOT_CONFIRMED" && words !== null) throw new AffiliateV2Error("VALIDATION_FAILED", { operation: "unconfirmed_listing_words_must_be_null", object: "affiliate_program_master" });
  return Object.freeze({
    id: row.id, workspaceId: row.workspace_id, aspName: text(row.asp_name), programId: text(row.program_id), advertiserName: text(row.advertiser_name), programName: text(row.program_name), category: text(row.category),
    rewardType: text(row.reward_type), rewardSummary: text(row.reward_summary), rewardDetails: row.reward_details == null ? null : Object.freeze({ ...row.reward_details }), epc: row.epc == null ? null : Number(row.epc), approvalRate: row.approval_rate == null ? null : Number(row.approval_rate), revisitWindowDays: row.revisit_window_days == null ? null : Number(row.revisit_window_days), confirmationDays: row.confirmation_days == null ? null : Number(row.confirmation_days),
    conversionConditions: text(row.conversion_conditions), rejectionConditions: text(row.rejection_conditions), prPoints: text(row.pr_points), listingPolicy: text(row.listing_policy) || "UNKNOWN", listingNgWords: words, listingNgWordsRaw: text(row.listing_ng_words_raw), listingVerificationStatus: verification, complianceNotes: text(row.compliance_notes), programStatus: text(row.program_status) || "UNKNOWN",
    affiliateUrl: text(row.affiliate_url), affiliateLinkStatus: text(row.affiliate_link_status) || "NOT_REGISTERED", affiliateUrlUpdatedAt: text(row.affiliate_url_updated_at), affiliateUrlUpdatedBy: text(row.affiliate_url_updated_by), sourceType: text(row.source_type), sourceVerifiedAt: text(row.source_verified_at), sourceNotes: text(row.source_notes), ownerNotes: text(row.owner_notes),
    businessGoal:text(row.business_goal),targetAudience:text(row.target_audience),promotionChannels:Object.freeze([...(row.promotion_channels||[])]),contentPlan:text(row.content_plan),complianceChecklist:Object.freeze({...(row.compliance_checklist||{})}),priority:row.priority==null?null:Number(row.priority),nextAction:text(row.next_action),nextActionDueAt:text(row.next_action_due_at),publicationStatus:text(row.publication_status)||"NOT_PUBLISHED",publicationUrl:text(row.publication_url),businessVersion:Number(row.business_version||1),
    createdAt: text(row.created_at), updatedAt: text(row.updated_at), externalExecution: "LOCKED",
  });
}

export function listingComplianceLabel(program) {
  return Object.freeze({ CONFIRMED: "確認済み", NOT_CONFIRMED: "未確認", NONE_CONFIRMED: "制限なし確認済み", UNKNOWN: "不明" })[program?.listingVerificationStatus] || "不明";
}
