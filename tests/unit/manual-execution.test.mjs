import test from "node:test";
import assert from "node:assert/strict";
import { buildManualDirectServiceExecutionCandidate, EXTERNAL_EXECUTION_STATUS } from "../../src/services/manualExecutionCandidate.js";

const input={workspaceId:"w",campaignId:"c",approvalRequestId:"a",payloadSnapshot:{title:"proposal"},approvalStatus:"approved",approvalScope:"internal_artifact",approvalSnapshotHash:"same",payloadSnapshotHash:"same",idempotencyKey:"k"};
test("creates only a dry-run manual candidate",()=>{const result=buildManualDirectServiceExecutionCandidate(input);assert.equal(result.ok,true);assert.equal(result.candidate.externalExecutionAllowed,false);assert.equal(result.candidate.adapterStatus,EXTERNAL_EXECUTION_STATUS);});
test("snapshot mismatch is blocked",()=>assert.equal(buildManualDirectServiceExecutionCandidate({...input,payloadSnapshotHash:"changed"}).reasonCode,"APPROVAL_PAYLOAD_MISMATCH"));
