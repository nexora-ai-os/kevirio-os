export const OWNER_WORKSPACE_SLUG = "kevirio-owner";
export const OWNER_WORKSPACE_NAME = "KEVIRIO Owner Workspace";
export const OWNER_BRAND_SLUG = "kevirio";

const safeFailure = (reasonCode) => ({ ok: false, status: "failure", reasonCode });

export async function inspectOwnerWorkspace(client) {
  if (!client?.auth?.getSession || !client?.from) return safeFailure("SUPABASE_CLIENT_UNAVAILABLE");
  try {
    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    const session = sessionData?.session;
    if (sessionError || !session?.user?.id) return safeFailure("OWNER_SESSION_REQUIRED");

    const workspaceResult = await client.from("workspaces")
      .select("id,name,slug,status")
      .eq("slug", OWNER_WORKSPACE_SLUG)
      .maybeSingle();
    if (workspaceResult.error) return safeFailure("REMOTE_SCHEMA_OR_GRANT_NOT_VERIFIED");
    if (!workspaceResult.data) {
      return { ok: true, status: "not_initialized", migrationStatus: "verified", workspace: null, membership: null, brand: null };
    }

    const workspace = workspaceResult.data;
    const [membershipResult, brandResult] = await Promise.all([
      client.from("workspace_members")
        .select("workspace_id,user_id,role,status")
        .eq("workspace_id", workspace.id)
        .eq("user_id", session.user.id)
        .maybeSingle(),
      client.from("brand_profiles")
        .select("id,workspace_id,name,slug,business_owner_type")
        .eq("workspace_id", workspace.id)
        .eq("slug", OWNER_BRAND_SLUG)
        .maybeSingle(),
    ]);
    if (membershipResult.error || brandResult.error) return safeFailure("REMOTE_SCHEMA_OR_GRANT_NOT_VERIFIED");
    if (!membershipResult.data || membershipResult.data.status !== "active" || membershipResult.data.role !== "owner" || !brandResult.data) {
      return safeFailure("BOOTSTRAP_INCOMPLETE");
    }
    return { ok: true, status: "ready", migrationStatus: "verified", workspace, membership: membershipResult.data, brand: brandResult.data };
  } catch {
    return safeFailure("REMOTE_CHECK_FAILED");
  }
}

export async function bootstrapOwnerWorkspace(client) {
  const before = await inspectOwnerWorkspace(client);
  if (before.ok && before.status === "ready") return { ...before, status: "already_exists" };
  if (!before.ok && before.reasonCode !== "BOOTSTRAP_INCOMPLETE") return before;
  if (!client?.rpc) return safeFailure("SUPABASE_CLIENT_UNAVAILABLE");
  try {
    const { error } = await client.rpc("bootstrap_owner_workspace", {
      p_slug: OWNER_WORKSPACE_SLUG,
      p_name: OWNER_WORKSPACE_NAME,
    });
    if (error) return safeFailure("BOOTSTRAP_RPC_FAILED");
    const after = await inspectOwnerWorkspace(client);
    if (!after.ok || after.status !== "ready") return safeFailure("BOOTSTRAP_VERIFICATION_FAILED");
    return { ...after, status: "success" };
  } catch {
    return safeFailure("BOOTSTRAP_RPC_FAILED");
  }
}
