import test from "node:test";
import assert from "node:assert/strict";
import { ACTION_CLASSES, COMPANY_CORE_DOMAINS, buildCompanyCoreSnapshot, evaluateCorePermission, validateDomainEnvelope } from "../../src/domain/companyCore.js";

const uuid = "11111111-1111-4111-8111-111111111111";
test("V3 Company Core exposes ten canonical domains and five action classes", () => {
  assert.deepEqual(COMPANY_CORE_DOMAINS, ["workspace","organization","business","team","knowledge","asset","decision","permission","capability","provider"]);
  assert.deepEqual(ACTION_CLASSES, ["read","propose","approve","mutate-internal","execute-external"]);
});
test("domain envelope requires provenance, truth, actor, retention and version", () => {
  const result = validateDomainEnvelope({ id:uuid, workspaceId:uuid, aggregate:"business", version:1, lifecycleState:"hypothesis", truthClass:"Unknown", source:{kind:"owner"}, actorType:"owner", retentionClass:"policy_defined", createdAt:"2026-08-05T00:00:00Z", updatedAt:"2026-08-05T00:00:00Z" });
  assert.equal(result.valid, true);
  assert.equal(validateDomainEnvelope({}).valid, false);
});
test("permission contract is workspace scoped, owner gated and externally locked", () => {
  const base = { workspaceId:uuid, sessionWorkspaceId:uuid, membershipStatus:"active" };
  assert.equal(evaluateCorePermission({...base, actorType:"owner", action:"approve"}).allowed, true);
  assert.equal(evaluateCorePermission({...base, actorType:"ai_employee", action:"approve"}).reasonCode, "OWNER_APPROVAL_REQUIRED");
  assert.equal(evaluateCorePermission({...base, actorType:"owner", action:"execute-external"}).reasonCode, "EXTERNAL_EXECUTION_LOCKED");
  assert.equal(evaluateCorePermission({...base, sessionWorkspaceId:"other", actorType:"owner", action:"read"}).allowed, false);
});
test("missing aggregate sources remain Unknown and never become Actual", () => {
  const snapshot = buildCompanyCoreSnapshot({ workspaceId:uuid, workspace:[{id:uuid}], migrationUnavailable:true, unavailableDomains:["organization","business","team"] });
  assert.equal(snapshot.domains.workspace.truthClass, "Actual");
  assert.equal(snapshot.domains.organization.truthClass, "Unknown");
  assert.equal(snapshot.domains.team.truthClass, "Unknown");
  assert.equal(snapshot.migrationUnavailable,true);
  assert.deepEqual(snapshot.domains.business.records, []);
  assert.equal(snapshot.externalExecution, false);
});
