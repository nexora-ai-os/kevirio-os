import test from "node:test";
import assert from "node:assert/strict";
import { buildProductionCandidatePreview, candidateIdempotencyKey } from "../../src/services/productionRevenueCandidate.js";

test("production candidate keeps mock, forecast and external boundaries explicit", () => {
  const value = buildProductionCandidatePreview();
  assert.equal(value.dataMode, "mock");
  assert.equal(value.provenance.isMock, true);
  assert.equal(value.artifact.externalExecutionAllowed, false);
  assert.match(value.artifact.disclosure, /MOCK/);
  assert.match(candidateIdempotencyKey(value), /^market:/);
});
