import test from "node:test";
import assert from "node:assert/strict";
import { bootstrapOwnerWorkspace, inspectOwnerWorkspace } from "../../src/services/workspaceBootstrapService.js";

function query(result) {
  const builder = {
    select: () => builder,
    eq: () => builder,
    maybeSingle: async () => result,
  };
  return builder;
}

function client({ workspace = null, membership = null, brand = null, rpcError = null } = {}) {
  let rpcCalls = 0;
  return {
    auth: { getSession: async () => ({ data: { session: { user: { id: "owner-1" } } }, error: null }) },
    from: (table) => query({ data: { workspaces: workspace, workspace_members: membership, brand_profiles: brand }[table], error: null }),
    rpc: async (name, args) => {
      rpcCalls += 1;
      assert.equal(name, "bootstrap_owner_workspace");
      assert.deepEqual(args, { p_slug: "kevirio-owner", p_name: "KEVIRIO Owner Workspace" });
      return { data: "workspace-1", error: rpcError };
    },
    get rpcCalls() { return rpcCalls; },
  };
}

const workspace = { id: "workspace-1", name: "KEVIRIO Owner Workspace", slug: "kevirio-owner", status: "active" };
const membership = { workspace_id: "workspace-1", user_id: "owner-1", role: "owner", status: "active" };
const brand = { id: "brand-1", workspace_id: "workspace-1", name: "KEVIRIO", slug: "kevirio", business_owner_type: "kevirio_owner" };

test("inspect uses authenticated session and reports uninitialized", async () => {
  const result = await inspectOwnerWorkspace(client());
  assert.equal(result.status, "not_initialized");
  assert.equal(result.migrationStatus, "verified");
});

test("existing workspace returns already_exists without RPC", async () => {
  const provider = client({ workspace, membership, brand });
  const result = await bootstrapOwnerWorkspace(provider);
  assert.equal(result.status, "already_exists");
  assert.equal(provider.rpcCalls, 0);
});

test("client never sends owner id to bootstrap RPC", async () => {
  let readCount = 0;
  const provider = client();
  provider.from = (table) => {
    if (table === "workspaces") {
      readCount += 1;
      return query({ data: readCount === 1 ? null : workspace, error: null });
    }
    return query({ data: table === "workspace_members" ? membership : brand, error: null });
  };
  const result = await bootstrapOwnerWorkspace(provider);
  assert.equal(result.status, "success");
  assert.equal(provider.rpcCalls, 1);
});

test("missing session fails closed before RPC", async () => {
  const provider = client();
  provider.auth.getSession = async () => ({ data: { session: null }, error: null });
  const result = await bootstrapOwnerWorkspace(provider);
  assert.equal(result.reasonCode, "OWNER_SESSION_REQUIRED");
  assert.equal(provider.rpcCalls, 0);
});
