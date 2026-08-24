import { normalizeAffiliateApprovalRate } from "../../domain/affiliateProgramMaster.js";

const EDITABLE_FIELDS = new Set([
  "aspName", "programId", "programName", "advertiserName", "category",
  "rewardType", "rewardSummary", "rewardAmount", "rewardCurrency", "rewardRate",
  "rewardNotes", "epc", "approvalRate", "revisitWindowDays", "confirmationDays",
  "conversionConditions", "rejectionConditions", "prPoints", "listingPolicy",
  "listingNgWords", "listingNgWordsRaw", "listingVerificationStatus",
  "complianceNotes", "sourceType", "sourceVerifiedAt", "sourceNotes", "ownerNotes",
]);

export function restoreAffiliateProposedChanges(draftPayload) {
  const proposed = draftPayload?.proposed_changes;
  if (!proposed || typeof proposed !== "object" || Array.isArray(proposed)) return null;

  const restored = Object.fromEntries(
    Object.entries(proposed).filter(([field]) => EDITABLE_FIELDS.has(field)),
  );

  if (proposed.rewardDetails && typeof proposed.rewardDetails === "object") {
    restored.rewardAmount = proposed.rewardDetails.amount ?? "";
    restored.rewardCurrency = proposed.rewardDetails.currency || "JPY";
    restored.rewardRate = proposed.rewardDetails.rate ?? "";
    restored.rewardNotes = proposed.rewardDetails.notes || "";
  }
  if (Array.isArray(restored.listingNgWords)) {
    restored.listingNgWords = restored.listingNgWords.join("\n");
  }
  if (Object.prototype.hasOwnProperty.call(restored, "approvalRate")) {
    restored.approvalRate = normalizeAffiliateApprovalRate(restored.approvalRate);
  }

  return restored;
}
