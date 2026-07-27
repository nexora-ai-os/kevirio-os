export const OWNER_WORKSPACE_SLUG = "kevirio-owner";
export const OWNER_WORKSPACE_NAME = "KEVIRIO Owner Workspace";
export const OWNER_BRAND_SLUG = "kevirio";

const safeFailure = (reasonCode) => ({ ok: false, status: "failure", reasonCode });
const REMOTE_TIMEOUT_MS=12000;
const withinRemoteDeadline=async(request)=>{let timer;try{return await Promise.race([Promise.resolve(request),new Promise((resolve)=>{timer=setTimeout(()=>resolve({data:null,error:{code:"REMOTE_TIMEOUT"}}),REMOTE_TIMEOUT_MS);})]);}finally{clearTimeout(timer);}};

export async function inspectOwnerWorkspace(client, verifiedSession = null) {
  if (!client?.auth?.getSession || !client?.from) return safeFailure("SUPABASE_CLIENT_UNAVAILABLE");
  try {
    let session=verifiedSession;
    if(!session){const {data:sessionData,error:sessionError}=await client.auth.getSession();if(sessionError)return safeFailure("OWNER_SESSION_REQUIRED");session=sessionData?.session;}
    if(!session?.user?.id)return safeFailure("OWNER_SESSION_REQUIRED");

    const workspaceResult = await withinRemoteDeadline(client.from("workspaces")
      .select("id,name,slug,status")
      .eq("slug", OWNER_WORKSPACE_SLUG)
      .maybeSingle());
    if (workspaceResult.error) return safeFailure("REMOTE_SCHEMA_OR_GRANT_NOT_VERIFIED");
    if (!workspaceResult.data) {
      return { ok: true, status: "not_initialized", migrationStatus: "verified", workspace: null, membership: null, brand: null };
    }

    const workspace = workspaceResult.data;
    const [membershipResult, brandResult] = await Promise.all([
      withinRemoteDeadline(client.from("workspace_members")
        .select("workspace_id,user_id,role,status")
        .eq("workspace_id", workspace.id)
        .eq("user_id", session.user.id)
        .maybeSingle()),
      withinRemoteDeadline(client.from("brand_profiles")
        .select("id,workspace_id,name,slug,business_owner_type")
        .eq("workspace_id", workspace.id)
        .eq("slug", OWNER_BRAND_SLUG)
        .maybeSingle()),
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

export async function bootstrapOwnerWorkspace(client, verifiedSession = null) {
  const before = await inspectOwnerWorkspace(client,verifiedSession);
  if (before.ok && before.status === "ready") return { ...before, status: "already_exists" };
  if (!before.ok && before.reasonCode !== "BOOTSTRAP_INCOMPLETE") return before;
  if (!client?.rpc) return safeFailure("SUPABASE_CLIENT_UNAVAILABLE");
  try {
    const { error } = await client.rpc("bootstrap_owner_workspace", {
      p_slug: OWNER_WORKSPACE_SLUG,
      p_name: OWNER_WORKSPACE_NAME,
    });
    if (error) return safeFailure("BOOTSTRAP_RPC_FAILED");
    const after = await inspectOwnerWorkspace(client,verifiedSession);
    if (!after.ok || after.status !== "ready") return safeFailure("BOOTSTRAP_VERIFICATION_FAILED");
    return { ...after, status: "success" };
  } catch {
    return safeFailure("BOOTSTRAP_RPC_FAILED");
  }
}
