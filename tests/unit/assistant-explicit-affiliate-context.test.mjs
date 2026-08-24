import test from "node:test";
import assert from "node:assert/strict";
import { assembleLiveOperationalContext } from "../../server/assistantContextBroker.js";

test("explicit Affiliate Program is pinned ahead of unrelated context", () => {
  const result = assembleLiveOperationalContext({
    query: "足りない項目だけ",
    feature: "affiliate",
    explicitAffiliateProgramId: "program-2",
    operational: [{ id: "old", object_type: "PROJECT", title: "Previous conversation project", state: "ACTIVE" }],
    affiliate: [
      { id: "program-1", program_name: "First Program", program_status: "ACTIVE" },
      { id: "program-2", program_name: "Active Program", program_status: "UNKNOWN", reward_summary: null, approval_rate: 33.33 },
    ],
  });
  assert.equal(result.hasExplicitAffiliateProgram, true);
  assert.ok(result.text.indexOf("Active Program") < result.text.indexOf("Previous conversation project"));
  assert.match(result.text, /Explicit Affiliate Program reference: program-2/);
  assert.match(result.text, /approval_rate=33.33/);
  assert.match(result.text, /reward_summary=UNKNOWN/);
});
