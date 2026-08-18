export const OWNER_AUTH_STATES = Object.freeze({
  LOADING: "loading",
  UNAUTHENTICATED: "unauthenticated",
  ACTIVE: "authenticated_active_owner",
  NOT_OWNER: "authenticated_not_owner",
  INACTIVE: "authenticated_inactive",
  PROVIDER_UNAVAILABLE: "provider_unavailable",
  SESSION_EXPIRED: "session_expired",
  CONSENT_REQUIRED: "consent_required",
  SUSPENDED: "suspended",
  DEACTIVATED: "deactivated",
});
const withAuthDeadline=async(request)=>{let timer;try{return await Promise.race([Promise.resolve(request),new Promise((resolve)=>{timer=setTimeout(()=>resolve({data:null,error:{code:"OWNER_AUTH_TIMEOUT"}}),12000);})]);}finally{clearTimeout(timer);}};

export async function resolveOwnerAuthState(client, session) {
  if (!client) return OWNER_AUTH_STATES.PROVIDER_UNAVAILABLE;
  if (!session?.user?.id) return OWNER_AUTH_STATES.UNAUTHENTICATED;
  try {
    const { data, error } = await withAuthDeadline(client.rpc("current_account_access_state"));
    if (error) return OWNER_AUTH_STATES.PROVIDER_UNAVAILABLE;
    if (data === "ACTIVE") return OWNER_AUTH_STATES.ACTIVE;
    if (data === "SUSPENDED") return OWNER_AUTH_STATES.SUSPENDED;
    if (data === "DEACTIVATED") return OWNER_AUTH_STATES.DEACTIVATED;
    if (["INVITED", "REGISTERING", "LEGAL_REVIEW_REQUIRED", "CONSENT_REQUIRED"].includes(data)) return OWNER_AUTH_STATES.CONSENT_REQUIRED;
    return OWNER_AUTH_STATES.UNAUTHENTICATED;
  } catch {
    return OWNER_AUTH_STATES.PROVIDER_UNAVAILABLE;
  }
}
