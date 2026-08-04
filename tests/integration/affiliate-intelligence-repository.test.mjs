import test from "node:test";
import assert from "node:assert/strict";
import { createAffiliateIntelligenceRepository } from "../../src/repositories/affiliateIntelligenceRepository.js";

test("affiliate reads stay workspace scoped", async () => {
  const calls=[]; const client={from(table){return{select(){return{eq(column,value){calls.push({table,column,value});return Promise.resolve({data:[],error:null});}}}}},rpc(){}};
  await createAffiliateIntelligenceRepository(client).loadPrograms("workspace-1");
  assert.deepEqual(calls,[{table:"affiliate_programs",column:"workspace_id",value:"workspace-1"}]);
});
test("draft mutation uses RPC and cannot unlock execution", async () => {
  const calls=[]; const client={from(){},rpc(name,args){calls.push({name,args});return Promise.resolve({data:"program-1",error:null});}};
  await createAffiliateIntelligenceRepository(client).saveProgram("offer-1",{aspName:"A8.net"},2,"affiliate-program:offer-1:v1");
  assert.equal(calls[0].name,"save_affiliate_program_draft");
  assert.equal(JSON.stringify(calls).includes("external_execution_allowed"),false);
  assert.equal(JSON.stringify(calls).includes("owner_id"),false);
});
