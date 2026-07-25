export const OWNER_AUTH_STATES = Object.freeze({
  LOADING: "loading",
  UNAUTHENTICATED: "unauthenticated",
  ACTIVE: "authenticated_active_owner",
  NOT_OWNER: "authenticated_not_owner",
  INACTIVE: "authenticated_inactive",
  PROVIDER_UNAVAILABLE: "provider_unavailable",
  SESSION_EXPIRED: "session_expired",
});

export async function resolveOwnerAuthState(client, session) {
  if (!client) return OWNER_AUTH_STATES.PROVIDER_UNAVAILABLE;
  if (!session?.user?.id) return OWNER_AUTH_STATES.UNAUTHENTICATED;
  try {
    const { data, error } = await client.from("owner_profiles").select("role,status").eq("owner_id", session.user.id).maybeSingle();
    if (error || !data || data.role !== "owner") return OWNER_AUTH_STATES.NOT_OWNER;
    if (data.status !== "active") return OWNER_AUTH_STATES.INACTIVE;
    return OWNER_AUTH_STATES.ACTIVE;
  } catch {
    return OWNER_AUTH_STATES.PROVIDER_UNAVAILABLE;
  }
}
