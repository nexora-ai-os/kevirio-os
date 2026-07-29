import { executeProviderPlatformRequest } from "./providerPlatformGateway.js";

export function executeOpenAIProviderGateway(body,options={}){
  const inputLength=JSON.stringify(body?.input||{}).length;const estimatedInputTokens=Math.ceil(inputLength/4);
  const request={mode:"dry_run",workspaceId:options.workspaceId||"owner-workspace-unresolved",workflowId:body?.correlationId||null,aiEmployeeId:options.aiEmployeeId||"owner-review-agent",provider:"openai",model:"gpt-5-nano",capability:"text_generation",purpose:body?.purpose,requestClass:"generate",estimatedInputTokens,maxOutputTokens:800,estimatedMaximumCostJpy:5,retryReserve:0,requestCount:1,batchSize:1,autonomousLoop:false,idempotencyKey:body?.idempotencyKey,promptVersion:"sandbox-direct-v1",retryCount:0,approval:options.costApproval||null};
  return executeProviderPlatformRequest(request,{env:options.env||process.env,workspaceId:request.workspaceId,ownerVerified:options.ownerContext?.ownerIdentityVerified===true,externalExecutionLocked:true});
}
