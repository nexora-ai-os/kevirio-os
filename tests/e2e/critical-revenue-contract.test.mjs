import test from "node:test";
import assert from "node:assert/strict";
import { transitionRevenueEntity } from "../../src/domain/revenueStateMachine.js";
import { createVerifiedRevenueRecord } from "../../src/domain/revenueEvidence.js";
import { buildManualDirectServiceExecutionCandidate } from "../../src/services/manualExecutionCandidate.js";

test("critical revenue contract reaches verified actual without external execution",()=>{
  assert.equal(transitionRevenueEntity("opportunity","recommended","proceeding",{idempotencyKey:"decision"}).ok,true);
  assert.equal(transitionRevenueEntity("campaign","review_required","approved_internal",{idempotencyKey:"approval"}).ok,true);
  assert.equal(transitionRevenueEntity("campaign","approved_internal","execution_ready",{idempotencyKey:"ready",approvalSnapshotHash:"v1",payloadSnapshotHash:"v1"}).ok,true);
  const manual=buildManualDirectServiceExecutionCandidate({workspaceId:"w",campaignId:"c",approvalRequestId:"a",payloadSnapshot:{version:1},approvalStatus:"approved",approvalScope:"internal_artifact",approvalSnapshotHash:"v1",payloadSnapshotHash:"v1",idempotencyKey:"export"});
  assert.equal(manual.candidate.externalExecutionAllowed,false);
  const revenue=createVerifiedRevenueRecord({id:"e",workspaceId:"w",brandId:"b",campaignId:"c",sourceType:"bank_reference",sourceReference:"bank-1",amountMinor:50000,costAmountMinor:5000,currency:"JPY",occurredAt:"2026-07-25T00:00:00.000Z",verificationStatus:"verified",lane:"service",valueType:"actual"},{verifiedBy:"owner",approvalScope:"actual_revenue_verification"});
  assert.equal(revenue.record.netAmountMinor,45000);
  assert.equal(revenue.record.valueType,"actual");
});
