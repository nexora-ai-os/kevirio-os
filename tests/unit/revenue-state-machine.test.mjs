import test from "node:test";
import assert from "node:assert/strict";
import { transitionRevenueEntity, requiresReapproval, transitionRevenueWorkflow } from "../../src/domain/revenueStateMachine.js";

test("allows deterministic opportunity transition",()=>assert.equal(transitionRevenueEntity("opportunity","recommended","proceeding",{idempotencyKey:"k1"}).ok,true));
test("forbids skipped campaign transition",()=>assert.equal(transitionRevenueEntity("campaign","draft","execution_ready",{idempotencyKey:"k2"}).reasonCode,"TRANSITION_FORBIDDEN"));
test("requires matching approval and payload snapshots",()=>assert.equal(transitionRevenueEntity("campaign","approved_internal","execution_ready",{idempotencyKey:"k3",approvalSnapshotHash:"a",payloadSnapshotHash:"b"}).reasonCode,"APPROVAL_PAYLOAD_MISMATCH"));
test("artifact version changes require reapproval",()=>assert.equal(requiresReapproval(1,2),true));
test("revenue workflow cannot skip evidence or approval",()=>{assert.equal(transitionRevenueWorkflow("evidence_waiting","actual_revenue_approval").ok,true);assert.equal(transitionRevenueWorkflow("evidence_waiting","revenue_recorded").ok,false);});
