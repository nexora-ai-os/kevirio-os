export const PROVIDER_COST_GUARD_VERSION="1.0.0";
export const SAFE_BUDGET_DEFAULTS=Object.freeze({currency:"JPY",maxCostPerRequest:0,hourlyBudget:0,dailyBudget:0,monthlyBudget:0,maxInputTokens:4000,maxOutputTokens:800,maxTotalTokens:4800,maxRequestsPerJob:1,maxRequestsPerWorkflow:3,concurrency:1,batchEnabled:false,autonomousLoopEnabled:false,maxRetries:1});
export const PROVIDER_MODEL_ALLOWLIST=Object.freeze({
  openai:Object.freeze({generation:["gpt-5-nano"],healthCheck:[]}),
  anthropic:Object.freeze({generation:[],healthCheck:[]}),
  gemini:Object.freeze({generation:[],healthCheck:["gemini-2.5-flash"]}),
  perplexity:Object.freeze({generation:[],healthCheck:["sonar"]}),
  canva:Object.freeze({generation:[],healthCheck:[]}),
  google:Object.freeze({generation:[],healthCheck:[]}),
});
export const MODEL_PRICING_JPY=Object.freeze({"openai:gpt-5-nano":Object.freeze({inputPerMillion:8,outputPerMillion:64,verifiedAt:"2026-07-20"})});
const PROVIDERS=new Set(Object.keys(PROVIDER_MODEL_ALLOWLIST));
const BLOCKING_RETRY_CLASSES=new Set(["authentication","authorization","billing","quota","policy","budget","model","workspace","ledger"]);
const number=(value)=>{const parsed=Number(value);return Number.isFinite(parsed)&&parsed>=0?parsed:null;};
const enabled=(value)=>String(value||"").trim().toLowerCase()==="true";
const safeFailure=(reasonCode,extra={})=>({allowed:false,status:"blocked",reasonCode,externalExecution:false,...extra});

export function loadProviderCostPolicy(env={},overrides={}){
  const pick=(name,fallback)=>env[name]===undefined?fallback:number(env[name]);
  const policy={...SAFE_BUDGET_DEFAULTS,maxCostPerRequest:pick("AI_MAX_COST_PER_REQUEST_JPY",SAFE_BUDGET_DEFAULTS.maxCostPerRequest),hourlyBudget:pick("AI_HOURLY_BUDGET_JPY",SAFE_BUDGET_DEFAULTS.hourlyBudget),dailyBudget:pick("AI_DAILY_BUDGET_JPY",SAFE_BUDGET_DEFAULTS.dailyBudget),monthlyBudget:pick("AI_MONTHLY_BUDGET_JPY",SAFE_BUDGET_DEFAULTS.monthlyBudget),maxInputTokens:pick("AI_MAX_INPUT_TOKENS",SAFE_BUDGET_DEFAULTS.maxInputTokens),maxOutputTokens:pick("AI_MAX_OUTPUT_TOKENS",SAFE_BUDGET_DEFAULTS.maxOutputTokens),maxTotalTokens:pick("AI_MAX_TOTAL_TOKENS",SAFE_BUDGET_DEFAULTS.maxTotalTokens),globalExecutionEnabled:enabled(env.EXTERNAL_EXECUTION_ENABLED),providerExecutionEnabled:Object.fromEntries([...PROVIDERS].map(id=>[id,enabled(env[`${id.toUpperCase()}_EXECUTION_ENABLED`])])),...overrides};
  const required=["maxCostPerRequest","hourlyBudget","dailyBudget","monthlyBudget","maxInputTokens","maxOutputTokens","maxTotalTokens"];
  return {...policy,valid:required.every(key=>number(policy[key])!==null)&&policy.maxTotalTokens>=policy.maxInputTokens+policy.maxOutputTokens};
}
export function estimateProviderCost({provider,model,inputTokens,estimatedInputTokens,maxOutputTokens,retryReserve=0,pricing=MODEL_PRICING_JPY}){
  inputTokens=inputTokens??estimatedInputTokens;
  const price=pricing[`${provider}:${model}`];if(!price||!price.verifiedAt)return safeFailure("PRICING_UNAVAILABLE",{estimatedCostJpy:null});
  if(![inputTokens,maxOutputTokens,retryReserve,price.inputPerMillion,price.outputPerMillion].every(v=>number(v)!==null))return safeFailure("COST_INPUT_INVALID",{estimatedCostJpy:null});
  const base=(inputTokens*price.inputPerMillion+maxOutputTokens*price.outputPerMillion)/1_000_000;return {allowed:true,estimatedCostJpy:base*(1+retryReserve),reservedCostJpy:base*(1+retryReserve),currency:"JPY",pricingVerifiedAt:price.verifiedAt};
}
export function evaluateProviderCostGuard(request={},context={}){
  const policy=context.policy;if(!policy?.valid)return safeFailure("COST_POLICY_UNAVAILABLE");
  if(!PROVIDERS.has(request.provider))return safeFailure("PROVIDER_NOT_ALLOWED");
  const health=request.requestClass==="health_check";
  if(!health&&!policy.globalExecutionEnabled)return safeFailure("GLOBAL_EXECUTION_LOCKED");
  if(!health&&!policy.providerExecutionEnabled?.[request.provider])return safeFailure("PROVIDER_EXECUTION_LOCKED");
  if(!health&&request.explicitOwnerAction!==true)return safeFailure("OWNER_EXPLICIT_ACTION_REQUIRED");
  if(!request.workspaceId||request.workspaceId!==context.workspaceId)return safeFailure("WORKSPACE_MISMATCH");
  if(!request.workflowId||!request.aiEmployeeId||!request.idempotencyKey)return safeFailure("REQUEST_CONTEXT_INCOMPLETE");
  if(request.batchSize!==undefined&&request.batchSize!==1)return safeFailure("BATCH_EXECUTION_DISABLED");
  if(request.autonomousLoop===true)return safeFailure("AUTONOMOUS_LOOP_DISABLED");
  if((context.inFlight||0)>=policy.concurrency)return safeFailure("CONCURRENCY_LIMIT_REACHED");
  const allowed=PROVIDER_MODEL_ALLOWLIST[request.provider]?.[health?"healthCheck":"generation"]||[];
  if(!allowed.includes(request.model)||/latest$/i.test(request.model))return safeFailure("MODEL_NOT_ALLOWLISTED");
  if(!Number.isInteger(request.estimatedInputTokens)||!Number.isInteger(request.maxOutputTokens)||request.estimatedInputTokens<0||request.maxOutputTokens<1)return safeFailure("TOKEN_ESTIMATE_INVALID");
  if(request.estimatedInputTokens>policy.maxInputTokens||request.maxOutputTokens>policy.maxOutputTokens||request.estimatedInputTokens+request.maxOutputTokens>policy.maxTotalTokens)return safeFailure("TOKEN_LIMIT_EXCEEDED");
  if((request.requestCount||1)>policy.maxRequestsPerJob||(context.workflowRequestCount||0)+(request.requestCount||1)>policy.maxRequestsPerWorkflow)return safeFailure("REQUEST_COUNT_LIMIT_EXCEEDED");
  if(context.usageAvailable!==true)return safeFailure("USAGE_UNAVAILABLE");
  if(context.ledgerAvailable!==true)return safeFailure("LEDGER_UNAVAILABLE");
  if(context.circuitOpen===true)return safeFailure("CIRCUIT_BREAKER_OPEN");
  const estimate=estimateProviderCost(request);if(!estimate.allowed)return estimate;
  if(!health&&!validApproval(request.approval,request,estimate))return safeFailure("OWNER_APPROVAL_REQUIRED",estimate);
  const spent=context.spent||{};const reserved=context.reserved||{};const projected=(key)=>number(spent[key])===null||number(reserved[key])===null?null:Number(spent[key])+Number(reserved[key])+estimate.reservedCostJpy;
  if(estimate.estimatedCostJpy>policy.maxCostPerRequest)return safeFailure("REQUEST_BUDGET_EXCEEDED",estimate);
  for(const [key,limit] of [["hourly",policy.hourlyBudget],["daily",policy.dailyBudget],["monthly",policy.monthlyBudget]]){const value=projected(key);if(value===null)return safeFailure("USAGE_UNAVAILABLE");if(value>limit)return safeFailure(`${key.toUpperCase()}_BUDGET_EXCEEDED`,estimate);}
  const workflowLimit=number(context.workflowBudgetJpy);const employeeLimit=number(context.aiEmployeeBudgetJpy);const workspaceLimit=number(context.workspaceBudgetJpy);
  if([workflowLimit,employeeLimit,workspaceLimit].some(v=>v===null))return safeFailure("SCOPED_BUDGET_UNAVAILABLE");
  if(Number(context.workflowSpentJpy||0)+estimate.reservedCostJpy>workflowLimit)return safeFailure("WORKFLOW_BUDGET_EXCEEDED",estimate);
  if(Number(context.aiEmployeeSpentJpy||0)+estimate.reservedCostJpy>employeeLimit)return safeFailure("AI_EMPLOYEE_BUDGET_EXCEEDED",estimate);
  if(Number(context.workspaceSpentJpy||0)+estimate.reservedCostJpy>workspaceLimit)return safeFailure("WORKSPACE_BUDGET_EXCEEDED",estimate);
  const ratio=Math.max(projected("hourly")/policy.hourlyBudget,projected("daily")/policy.dailyBudget,projected("monthly")/policy.monthlyBudget);
  if(ratio>=1)return safeFailure("BUDGET_HARD_STOP",estimate);if(ratio>=.9&&!validApproval(request.approval,request,estimate))return safeFailure("OWNER_APPROVAL_REQUIRED",{...estimate,threshold:"90%"});
  if(estimate.estimatedCostJpy>policy.maxCostPerRequest*.75&&!validApproval(request.approval,request,estimate))return safeFailure("OWNER_APPROVAL_REQUIRED",{...estimate,threshold:"75%"});
  return {allowed:true,status:"reserved_required",reasonCode:ratio>=.75?"NONESSENTIAL_AUTOMATION_STOP":ratio>=.5?"BUDGET_NOTIFICATION_REQUIRED":"COST_GUARD_ALLOWED",...estimate,usageRatio:ratio,externalExecution:false};
}
export function validApproval(approval,request,estimate,now=Date.now()){return Boolean(approval&&approval.status==="approved"&&approval.oneTimeUse===true&&approval.used!==true&&Date.parse(approval.expiresAt)>now&&approval.provider===request.provider&&approval.model===request.model&&approval.workflowId===request.workflowId&&approval.estimatedMaximumCostJpy>=estimate.estimatedCostJpy&&approval.maxOutputTokens===request.maxOutputTokens);}
export function evaluateRetryGuard({retryCount=0,errorClass,retryAfterSeconds,budgetAllowed,idempotencyConfirmed}){if(BLOCKING_RETRY_CLASSES.has(errorClass))return safeFailure("RETRY_FORBIDDEN_ERROR_CLASS");if(retryCount>=SAFE_BUDGET_DEFAULTS.maxRetries)return safeFailure("RETRY_LIMIT_REACHED");if(errorClass==="timeout"&&idempotencyConfirmed!==true)return safeFailure("RETRY_IDEMPOTENCY_UNCONFIRMED");if(errorClass==="rate_limit"&&(!Number.isFinite(retryAfterSeconds)||retryAfterSeconds<0))return safeFailure("RETRY_AFTER_REQUIRED");if(budgetAllowed!==true)return safeFailure("RETRY_BUDGET_BLOCKED");return {allowed:true,status:"retry_once",externalExecution:false};}
export function thresholdAction(ratio){if(!Number.isFinite(ratio))return "hard_stop";if(ratio>=1)return "hard_stop";if(ratio>=.9)return "owner_approval";if(ratio>=.75)return "stop_nonessential";if(ratio>=.5)return "notify";return "continue";}
export function nextCircuitBreakerState(current={},event={}){const state=current.state||"closed";const failures=Number(current.consecutiveFailures||0);if(event.type==="success")return {state:"closed",consecutiveFailures:0,lastFailureClass:null};if(event.type!=="failure")return {state,consecutiveFailures:failures,lastFailureClass:current.lastFailureClass||null};if(BLOCKING_RETRY_CLASSES.has(event.errorClass)||failures+1>=3)return {state:"open",consecutiveFailures:failures+1,lastFailureClass:event.errorClass||"provider"};return {state:"closed",consecutiveFailures:failures+1,lastFailureClass:event.errorClass||"provider"};}
export function buildProviderRuntimeState({provider,policy,spent={},reserved={},currentReservations=0,blockedRequestCount=0,circuit={},lastFailure=null}={}){const remaining=(limit,key)=>Number.isFinite(limit)&&Number.isFinite(Number(spent[key]))&&Number.isFinite(Number(reserved[key]))?Math.max(0,limit-Number(spent[key])-Number(reserved[key])):null;return {provider,externalExecution:policy?.globalExecutionEnabled===true?"OWNER_LOCK_REQUIRED":"LOCKED",providerExecution:policy?.providerExecutionEnabled?.[provider]===true?"OWNER_LOCK_REQUIRED":"LOCKED",usage:{hourlySpentJpy:Number(spent.hourly||0),dailySpentJpy:Number(spent.daily||0),monthlySpentJpy:Number(spent.monthly||0),hourlyRemainingJpy:remaining(policy?.hourlyBudget,"hourly"),dailyRemainingJpy:remaining(policy?.dailyBudget,"daily"),monthlyRemainingJpy:remaining(policy?.monthlyBudget,"monthly")},currentReservations:Number(currentReservations||0),blockedRequestCount:Number(blockedRequestCount||0),circuitBreakerState:circuit.state||"closed",lastFailureClass:lastFailure?.errorClass||null,activeModelAllowlist:[...(PROVIDER_MODEL_ALLOWLIST[provider]?.generation||[])],secretsExposed:false};}
