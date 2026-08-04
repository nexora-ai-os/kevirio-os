import test from "node:test";
import assert from "node:assert/strict";
import { affiliateProgramStage, classifyUrl, deriveNextOwnerAction, validateAffiliateProgram } from "../../src/domain/affiliateIntelligence.js";

test("registered offer becomes operational preparation waiting", () => {
  const action = deriveNextOwnerAction({ offers: [{ id: "offer-1" }] });
  assert.equal(action.title, "運用準備待ち"); assert.equal(action.offerId, "offer-1");
});
test("owner action follows maturity instead of offer count", () => {
  const base = { offers: [{ id: "offer-1" }], programs: [{ id: "program-1", offer_id: "offer-1", status: "content_plan" }] };
  assert.equal(deriveNextOwnerAction(base).title, "運用設計中");
  assert.equal(deriveNextOwnerAction({ ...base, operations: [{ offer_id: "offer-1", status: "owner_artifact_approval", campaign_id: "c" }] }).title, "Owner承認待ち");
});
test("lifecycle never treats unknown as completed", () => assert.equal(affiliateProgramStage({ status: "research_required" }, null), "research_required"));
test("URL validation rejects executable and malformed schemes", () => {
  assert.equal(classifyUrl("https://example.com/path").valid, true);
  assert.equal(classifyUrl("javascript:alert(1)").valid, false);
  assert.equal(classifyUrl("data:text/html,test").valid, false);
});
test("commission and required fields are validated", () => {
  const result = validateAffiliateProgram({ aspName: "A8.net", advertiserName: "A", programName: "P", commissionRate: 101, currency: "JPY", conversionConditions: "購入", disclosureRequirements: "広告", prohibitedClaims: "虚偽", targetAudience: "成人", claimPlan: "比較", plannedChannels: "Owned", evidencePlan: "ASP確定画面", ownerConfirmed: true }, 9);
  assert.equal(result.valid, false); assert.match(result.errors[0], /0〜100/);
});
