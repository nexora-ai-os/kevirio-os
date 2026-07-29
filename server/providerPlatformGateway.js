import { buildProviderDryRun,evaluateProviderPermission,validateProviderApproval } from "../src/services/providerPlatform.js";
import { getProviderAdapter } from "./providerAdapterContract.js";
import { executeProviderGateway } from "./providerGateway.js";
const blocked=(reasonCode)=>({ok:false,status:"blocked",reasonCode,externalExecution:false,productionExecution:false});
export async function executeProviderPlatformRequest(request={},options={}){
  const adapter=getProviderAdapter(request.provider);if(!adapter)return blocked("PROVIDER_ADAPTER_UNAVAILABLE");
  const permission=evaluateProviderPermission({...request,requestClass:request.mode==="dry_run"?"inspect":request.requestClass,ownerVerified:options.ownerVerified,sessionWorkspaceId:options.workspaceId});
  if(request.mode==="dry_run"){if(!permission.allowed)return blocked(permission.reasonCode);return {ok:true,status:"preview",dryRun:buildProviderDryRun(request,options.policy),externalExecution:false,productionExecution:false};}
  if(!permission.allowed)return blocked(permission.reasonCode);
  if(permission.approvalRequired&&!validateProviderApproval(request.approval,request))return blocked("OWNER_APPROVAL_REQUIRED");
  if(options.externalExecutionLocked!==false)return blocked("EXTERNAL_EXECUTION_LOCKED");
  if(typeof adapter.dispatch!=="function")return blocked("PROVIDER_DISPATCH_UNAVAILABLE");
  return executeProviderGateway(request,{...options,dispatch:({reservation,decision})=>adapter.dispatch(adapter.normalizeRequest(request),{reservation,decision,signal:options.signal})});
}
