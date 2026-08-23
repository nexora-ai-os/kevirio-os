import test from "node:test";
import assert from "node:assert/strict";
import { restoreAffiliateProposedChanges } from "../../src/components/affiliate-v2/affiliateDraftRestore.js";

test("restores saved proposed_changes into Affiliate edit-form keys", () => {
  const restored = restoreAffiliateProposedChanges({
    affiliate_attachment_extraction: { raw_file_content_stored: false },
    proposed_changes: {
      rewardSummary: "新規購入 3,000円",
      epc: 125.5,
      approvalRate: 82.5,
      revisitWindowDays: 30,
      conversionConditions: "新規購入・入金確認",
      listingNgWords: ["必ず稼げる", "絶対"],
      ownerNotes: null,
    },
  });

  assert.deepEqual(restored, {
    rewardSummary: "新規購入 3,000円",
    epc: 125.5,
    approvalRate: 82.5,
    revisitWindowDays: 30,
    conversionConditions: "新規購入・入金確認",
    listingNgWords: "必ず稼げる\n絶対",
    ownerNotes: null,
  });
});

test("flattens structured reward details and rejects non-form metadata", () => {
  const restored = restoreAffiliateProposedChanges({
    proposed_changes: {
      rewardDetails: { amount: 3000, currency: "JPY", rate: null, notes: "税込" },
      rewardType: "FIXED",
      unexpectedServerField: "do-not-hydrate",
    },
  });

  assert.deepEqual(restored, {
    rewardType: "FIXED",
    rewardAmount: 3000,
    rewardCurrency: "JPY",
    rewardRate: "",
    rewardNotes: "税込",
  });
  assert.equal(restoreAffiliateProposedChanges(null), null);
  assert.equal(restoreAffiliateProposedChanges({ proposed_changes: [] }), null);
});
