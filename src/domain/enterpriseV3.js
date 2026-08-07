export const ORGANIZATION_ROLES=Object.freeze(["owner","administrator","member","reviewer"]);
export const ENTERPRISE_MATURITY="Future";
export const API_MAX_PAGE_SIZE=100;

export function validateTenantContext(value={}) {
  const errors=[];
  if(!value.organizationId||!value.workspaceId||!value.actorId)errors.push("tenant_identity_required");
  if(!ORGANIZATION_ROLES.includes(value.role)||value.membershipStatus!=="active")errors.push("active_role_required");
  if(!Array.isArray(value.allowedWorkspaceIds)||!value.allowedWorkspaceIds.includes(value.workspaceId))errors.push("workspace_access_denied");
  return Object.freeze({valid:errors.length===0,errors:Object.freeze(errors)});
}

export function authorizeCrossWorkspaceRead(context={},workspaceIds=[]) {
  if(!validateTenantContext(context).valid)return Object.freeze({allowed:false,reasonCode:"TENANT_CONTEXT_INVALID",workspaceIds:Object.freeze([])});
  const requested=[...new Set(workspaceIds)];
  if(context.role!=="owner"&&context.role!=="administrator")return Object.freeze({allowed:false,reasonCode:"ORGANIZATION_ADMIN_REQUIRED",workspaceIds:Object.freeze([])});
  if(requested.some((id)=>!context.allowedWorkspaceIds.includes(id)))return Object.freeze({allowed:false,reasonCode:"CROSS_TENANT_ACCESS_DENIED",workspaceIds:Object.freeze([])});
  return Object.freeze({allowed:true,reasonCode:"READ_ONLY_PROJECTION_ALLOWED",workspaceIds:Object.freeze(requested),externalExecution:false});
}

export function normalizeApiPage({limit=50,cursor=null}={}) {
  const safeLimit=Number.isInteger(limit)&&limit>0?Math.min(limit,API_MAX_PAGE_SIZE):50;
  const safeCursor=typeof cursor==="string"&&/^[A-Za-z0-9_-]{1,256}$/.test(cursor)?cursor:null;
  return Object.freeze({limit:safeLimit,cursor:safeCursor,ordering:"stable_id",truthClassRequired:true,workspaceScopeRequired:true});
}

export function enterpriseScaleContract() {
  return Object.freeze({businesses:100000,contentAndEvidence:"millions",pagination:"cursor",projection:"asynchronous",partitionKeys:Object.freeze(["workspace_id","created_at"]),crossWorkspaceTransactions:false,syntheticTruthClass:"Test",publicSaaS:false});
}
