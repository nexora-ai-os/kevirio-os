import {evaluateEmployeeRuntimeChain} from "../src/services/aiEmployeePlatform.js";

const blocked=(reasonCode)=>({ok:false,status:"blocked",reasonCode,externalExecution:false,googleApiRequests:0,aiProviderRequests:0});

export async function executeAIEmployeeRuntime(request={},options={}){
  const decision=evaluateEmployeeRuntimeChain({ownerVerified:options.ownerVerified,workspaceId:request.workspaceId,sessionWorkspaceId:options.workspaceId,plannerReady:request.plannerReady,taskValidated:request.taskValidated,workflowReady:request.workflowReady,capabilityAllowed:request.capabilityAllowed,permissionAllowed:request.permissionAllowed,connectionReady:request.connectionReady,scopeReady:request.scopeReady,classificationAllowed:request.classificationAllowed,approvalRequired:request.approvalRequired,approvalValid:request.approvalValid,quotaReserved:request.quotaReserved,providerPolicyAllowed:request.providerPolicyAllowed,costGuardAllowed:request.costGuardAllowed,costReservationReady:request.costReservationReady,globalExecutionEnabled:options.globalExecutionEnabled,providerExecutionEnabled:options.providerExecutionEnabled,externalExecutionLocked:options.externalExecutionLocked});
  if(!decision.allowed)return blocked(decision.reasonCode);
  if(typeof options.dispatch!=="function")return blocked("PROVIDER_DISPATCH_UNAVAILABLE");
  try{return await options.dispatch(request);}catch{return blocked("AI_EMPLOYEE_EXECUTION_FAILED");}
}
