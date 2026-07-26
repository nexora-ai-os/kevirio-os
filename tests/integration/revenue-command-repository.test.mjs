import test from "node:test";
import assert from "node:assert/strict";
import { createRevenueRepository } from "../../src/repositories/revenueRepository.js";

test("revenue commands do not accept an owner id and use the canonical RPC", async () => {
  let call;
  const client = {
    from() {},
    rpc(name, args) { call = { name, args }; return Promise.resolve({ data: { status: "created" }, error: null }); },
  };
  await createRevenueRepository(client).createRevenueCandidate("workspace", "brand", "key", { title: "Candidate" });
  assert.equal(call.name, "create_revenue_candidate");
  assert.equal("owner_id" in call.args, false);
  assert.deepEqual(Object.keys(call.args).sort(), ["p_brand_id", "p_candidate", "p_idempotency_key", "p_workspace_id"]);
});

test("snapshot reload restores packages through the audited retrieval command", async () => {
  const calls=[];
  const client={
    from:()=>({select:()=>({eq:()=>Promise.resolve({data:[],error:null})})}),
    rpc:(name,args)=>{calls.push({name,args});return Promise.resolve({data:name==="retrieve_manual_execution_packages"?[{id:"package-1"}]:null,error:null});},
  };
  const snapshot=await createRevenueRepository(client).loadSnapshot("workspace");
  assert.deepEqual(snapshot.executionPackages,[{id:"package-1"}]);
  assert.deepEqual(calls[0],{name:"retrieve_manual_execution_packages",args:{p_workspace_id:"workspace"}});
});

test("manual package commands expose no external execution switch", async () => {
  const calls=[];
  const client={rpc:(name,args)=>{calls.push({name,args});return Promise.resolve({data:"package",error:null});}};
  const repository=createRevenueRepository(client);
  await repository.generateManualPackage("approval");
  await repository.recordManualPackageAccess("package","viewed");
  assert.deepEqual(calls,[
    {name:"generate_manual_execution_package",args:{p_approval_request_id:"approval"}},
    {name:"record_manual_package_access",args:{p_package_id:"package",p_action:"viewed"}},
  ]);
  assert.equal(JSON.stringify(calls).includes("external"),false);
});
