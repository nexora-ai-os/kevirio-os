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
