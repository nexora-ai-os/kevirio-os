import test from "node:test";
import assert from "node:assert/strict";
import { normalizeAffiliateApprovalRate, normalizeAffiliateProgramPracticalUpdate } from "../../src/domain/affiliateProgramMaster.js";
import { restoreAffiliateProposedChanges } from "../../src/components/affiliate-v2/affiliateDraftRestore.js";

test("approval rate uses the canonical 0-100 percentage scale without rounding", () => {
  assert.equal(normalizeAffiliateApprovalRate("33.33%"), 33.33);
  assert.equal(normalizeAffiliateApprovalRate(0), 0);
  assert.equal(normalizeAffiliateApprovalRate("100%"), 100);
  assert.equal(normalizeAffiliateApprovalRate(null), null);
  assert.equal(normalizeAffiliateApprovalRate("Unknown"), null);
  for (const value of [-0.01, 100.01, "nope"]) assert.throws(() => normalizeAffiliateApprovalRate(value), /VALIDATION_FAILED/);
});

test("practical update sends decimal approval rate as a JSON number", () => {
  const normalized = normalizeAffiliateProgramPracticalUpdate({
    expectedUpdatedAt: "2026-08-20T00:00:00.123456+00:00",
    expectedBusinessVersion: 2,
    changes: { approvalRate: "33.33%" },
  });
  assert.equal(normalized.changes.approval_rate, 33.33);
});

test("saved extraction restores a percent-marked approval rate as a decimal number", () => {
  assert.equal(restoreAffiliateProposedChanges({ proposed_changes: { approvalRate: "33.33%" } }).approvalRate, 33.33);
});
