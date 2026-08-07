import test from "node:test";
import assert from "node:assert/strict";
import { createCompanyCoreRepository } from "../../src/repositories/companyCoreRepository.js";

function clientFixture(calls,{migrationUnavailable=false}={}) {
  return { from(table) { calls.push({table}); return { select(columns) { calls.at(-1).columns=columns; return { eq(column,value) { calls.at(-1).filter=[column,value]; return { async limit(limit) { calls.at(-1).limit=limit;return migrationUnavailable&&["organizations","businesses","teams"].includes(table)?{data:null,error:{code:"42P01"}}:{data:[{id:table}],error:null}; } }; } }; } }; } };
}
test("repository reads canonical sources concurrently with workspace filters", async () => {
  const calls=[]; const snapshot=await createCompanyCoreRepository(clientFixture(calls)).readSnapshot("workspace-1");
  assert.equal(calls.length,10);
  assert.ok(calls.every(call=>call.limit===100));
  assert.equal(calls.find(call=>call.table==="workspaces").filter[0],"id");
  assert.ok(calls.filter(call=>call.table!=="workspaces").every(call=>call.filter[0]==="workspace_id"));
  assert.equal(snapshot.domains.organization.truthClass,"Actual");
  assert.equal(snapshot.domains.team.source,"teams");
  assert.equal(snapshot.domains.provider.source,"provider_connections");
  assert.equal(snapshot.migrationUnavailable,false);
});
test("Migration 016 tables fail closed without losing existing canonical domains",async()=>{
  const snapshot=await createCompanyCoreRepository(clientFixture([],{migrationUnavailable:true})).readSnapshot("workspace-1");
  assert.equal(snapshot.migrationUnavailable,true);
  assert.equal(Object.isFrozen(snapshot.unavailableDomains),true);
  assert.deepEqual([...snapshot.unavailableDomains].sort(),["business","organization","team"]);
  assert.equal(snapshot.domains.organization.truthClass,"Unknown");
  assert.equal(snapshot.domains.workspace.truthClass,"Actual");
});
test("repository rejects missing workspace and does not expose credential columns", async () => {
  const calls=[]; const repository=createCompanyCoreRepository(clientFixture(calls));
  await assert.rejects(()=>repository.readSnapshot(),/workspace_id_required/);
  await repository.readSnapshot("workspace-1");
  const providerColumns=calls.find(call=>call.table==="provider_connections").columns;
  assert.doesNotMatch(providerColumns,/token|ciphertext|secret|credential/i);
});
