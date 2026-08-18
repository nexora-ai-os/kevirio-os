import { createSupabaseServerClient } from "./supabaseServerClient.js";
function locked(reasonCode) { return { ok: false, reasonCode, context: null }; }
export async function resolveVerifiedOwnerContext(req, options = {}) {
  if (req?.method !== "POST" || !String(req?.headers?.["content-type"] || "").toLowerCase().startsWith("application/json")) return locked("REQUEST_INTEGRITY_REQUIRED");
  const authorization = req.headers?.authorization || ""; if (!/^Bearer\s+\S+$/.test(authorization)) return locked("OWNER_SESSION_INVALID");
  const origin = req.headers?.origin; const allowedOrigin = options.allowedOrigin || process.env.KEVIRIO_ALLOWED_ORIGIN; if (!allowedOrigin || origin !== allowedOrigin) return locked("REQUEST_ORIGIN_NOT_ALLOWED");
  const client = options.client || createSupabaseServerClient(); if (!client?.auth?.getUser) return locked("OWNER_AUTH_PROVIDER_REQUIRED");
  let userResult;try{userResult=await client.auth.getUser(authorization.slice(7).trim())}catch{return locked("OWNER_SESSION_INVALID")};const ownerId = userResult?.data?.user?.id; if (!ownerId) return locked("OWNER_SESSION_INVALID");
  let profile;try{profile=await client.from("owner_profiles").select("role,status").eq("owner_id", ownerId).maybeSingle()}catch{return locked("OWNER_PROFILE_NOT_ACTIVE")};if (profile?.error || profile?.data?.role !== "owner" || profile?.data?.status !== "active") return locked("OWNER_PROFILE_NOT_ACTIVE");
  return { ok: true, context: { ownerId, ownerIdentityVerified: true, sessionVerified: true, csrfVerified: true } };
}
export async function resolveVerifiedOwnerWorkspaceContext(req,workspaceId,options={}){
  const verified=await resolveVerifiedOwnerContext(req,options);if(!verified.ok)return verified;
  if(typeof workspaceId!=="string"||!/^[0-9a-f-]{36}$/i.test(workspaceId))return locked("WORKSPACE_CONTEXT_REQUIRED");
  const client=options.client||createSupabaseServerClient();let membership;try{membership=await client.from("workspace_members").select("workspace_id,role,status").eq("workspace_id",workspaceId).eq("user_id",verified.context.ownerId).maybeSingle()}catch{return locked("WORKSPACE_ACCESS_DENIED")};
  if(membership.error||membership.data?.role!=="owner"||membership.data?.status!=="active")return locked("WORKSPACE_ACCESS_DENIED");
  return {ok:true,context:{...verified.context,workspaceId}};
}
