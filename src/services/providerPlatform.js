export const PROVIDER_PLATFORM_VERSION = "1.0.0";
export const PROVIDERS = Object.freeze(["openai", "anthropic", "gemini", "perplexity", "google", "canva"]);
export const CONNECTION_STATES = Object.freeze(["not_configured","credential_present","configuration_invalid","authorization_required","authorization_pending","connected","connected_scope_limited","token_expiring","refresh_failed","revoked","disconnected","suspended","locked","error"]);
export const REQUEST_CLASSES = Object.freeze(["inspect","read","generate","draft","write","send","publish","delete","revoke","configuration"]);
export const ERROR_CLASSES = Object.freeze(["configuration_error","credential_missing","authentication_failed","authorization_failed","scope_missing","permission_denied","account_mismatch","token_expired","refresh_failed","revoked","invalid_request","unsupported_model","rate_limited","quota_exhausted","billing_blocked","budget_blocked","cost_unknown","policy_blocked","approval_required","approval_invalid","circuit_open","provider_unavailable","timeout","network_error","response_invalid","ledger_failure","reservation_failure","internal_error"]);

const ALWAYS_LOCKED = new Set(["generate","draft","write","send","publish","delete","revoke"]);
export function evaluateProviderPermission(input = {}) {
  if (!input.workspaceId || !input.ownerVerified) return { allowed:false, reasonCode:"OWNER_WORKSPACE_REQUIRED", externalExecution:false };
  if (!PROVIDERS.includes(input.provider) || !REQUEST_CLASSES.includes(input.requestClass)) return { allowed:false, reasonCode:"PROVIDER_REQUEST_INVALID", externalExecution:false };
  if (input.workspaceId !== input.sessionWorkspaceId) return { allowed:false, reasonCode:"WORKSPACE_MISMATCH", externalExecution:false };
  if (ALWAYS_LOCKED.has(input.requestClass)) return { allowed:false, reasonCode:"EXTERNAL_EXECUTION_LOCKED", approvalRequired:true, externalExecution:false };
  return { allowed:true, reasonCode:"INSPECTION_ALLOWED", approvalRequired:false, externalExecution:false };
}

export function validateProviderApproval(approval, request, now = Date.now()) {
  const snapshot = approval?.snapshot;
  return Boolean(approval?.status === "approved" && approval.oneTimeUse === true && approval.used !== true && Date.parse(approval.expiresAt) > now && snapshot?.workspaceId === request.workspaceId && snapshot?.provider === request.provider && snapshot?.requestClass === request.requestClass && snapshot?.capability === request.capability && snapshot?.idempotencyKey === request.idempotencyKey);
}

export function normalizeProviderError(error = {}) {
  const status = Number(error.status || error.statusCode || 0);
  let errorClass = ERROR_CLASSES.includes(error.errorClass) ? error.errorClass : "internal_error";
  if (status === 401) errorClass = "authentication_failed";
  else if (status === 403) errorClass = "permission_denied";
  else if (status === 429) errorClass = error.quota === true ? "quota_exhausted" : "rate_limited";
  else if (status >= 500) errorClass = "provider_unavailable";
  return { errorClass, retryable:["rate_limited","provider_unavailable","timeout","network_error"].includes(errorClass), safeMessage:"Provider request was safely blocked or failed.", providerCode:typeof error.code === "string" ? error.code.slice(0,80) : null };
}

export function buildProviderDryRun(request = {}, policy = {}) {
  const output = { mode:"dry_run", provider:request.provider, model:request.model, capability:request.capability, requestClass:request.requestClass, estimatedInputTokens:Number(request.estimatedInputTokens||0), maxOutputTokens:Number(request.maxOutputTokens||0), estimatedMaximumCostJpy:Number(request.estimatedMaximumCostJpy||0), requiredApproval:ALWAYS_LOCKED.has(request.requestClass), requiredScopes:[...(request.requiredScopes||[])], budgetImpactJpy:Number(request.estimatedMaximumCostJpy||0), expectedLedgerStatus:"reserved", expectedReservation:true, normalizedRequest:{ provider:request.provider, model:request.model, capability:request.capability, requestClass:request.requestClass }, externalRequestCount:0, tokenRefreshCount:0, externalExecution:false, productionExecution:false, policyVersion:policy.version||null };
  return Object.freeze(output);
}

export function buildConnectionView(connection = {}) {
  const state = CONNECTION_STATES.includes(connection.state) ? connection.state : "error";
  return { provider:connection.provider, type:connection.type||"api_key", credentialState:connection.credentialPresent ? "設定あり" : "未設定", connectionState:state, permissionState:connection.permissionState||"未確認", costState:connection.costState||"利用停止中", circuitState:connection.circuitState||"closed", maturity:connection.maturity||"Locked", externalExecution:"LOCKED", grantedScopes:[...(connection.grantedScopes||[])], missingScopes:[...(connection.missingScopes||[])], lastCheckedAt:connection.lastCheckedAt||null, lastSuccessAt:connection.lastSuccessAt||null, ownerActionRequired:connection.ownerActionRequired||"設定内容を確認してください" };
}
