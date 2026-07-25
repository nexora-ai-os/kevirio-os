const SOURCE_TYPES = new Set(["invoice_paid","bank_reference","marketplace_order","signed_contract","affiliate_commission","platform_sales_export"]);
const LANES = new Set(["service","affiliate","digital_product","media"]);
export function validateEvidenceCandidate(input) {
  const errors=[];
  if (!input?.workspaceId || !input?.campaignId) errors.push("ATTRIBUTION_REQUIRED");
  if (!SOURCE_TYPES.has(input?.sourceType) || !String(input?.sourceReference || "").trim()) errors.push("SOURCE_REFERENCE_REQUIRED");
  if (!Number.isSafeInteger(input?.amountMinor) || input.amountMinor < 0) errors.push("AMOUNT_MINOR_INVALID");
  if (!Number.isSafeInteger(input?.costAmountMinor) || input.costAmountMinor < 0) errors.push("COST_MINOR_INVALID");
  if (!/^[A-Z]{3}$/.test(input?.currency || "")) errors.push("CURRENCY_INVALID");
  if (!Number.isFinite(Date.parse(input?.occurredAt || ""))) errors.push("OCCURRED_AT_INVALID");
  if (input?.valueType && input.valueType !== "actual") errors.push("ACTUAL_EVIDENCE_ONLY");
  return { valid:errors.length===0, errors };
}
export function createVerifiedRevenueRecord(evidence, verification) {
  const checked=validateEvidenceCandidate(evidence);
  if (!checked.valid) return { ok:false, errors:checked.errors };
  if (evidence.verificationStatus !== "verified" || !verification?.verifiedBy || verification.approvalScope !== "actual_revenue_verification") return { ok:false, errors:["VERIFIED_OWNER_APPROVAL_REQUIRED"] };
  if (!LANES.has(evidence.lane)) return { ok:false, errors:["LANE_INVALID"] };
  return { ok:true, record:{ workspaceId:evidence.workspaceId, brandId:evidence.brandId, clientId:evidence.clientId || null, campaignId:evidence.campaignId, evidenceCandidateId:evidence.id, lane:evidence.lane, currency:evidence.currency, grossAmountMinor:evidence.amountMinor, costAmountMinor:evidence.costAmountMinor, netAmountMinor:evidence.amountMinor-evidence.costAmountMinor, recognizedAt:evidence.occurredAt, verificationMethod:evidence.sourceType, verifiedBy:verification.verifiedBy, correctionOfId:null, valueType:"actual" } };
}
