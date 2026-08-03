export const AI_EMPLOYEE_PLATFORM_VERSION="1.1.0";
export const TASK_STATES=Object.freeze(["draft","validated","dry_run_ready","awaiting_connection","awaiting_scope","awaiting_approval","ready","reserved","running","partial","completed","failed","cancelled","expired"]);
export const TERMINAL_STATES=new Set(["completed","failed","cancelled","expired"]);
const TRANSITIONS=Object.freeze({draft:["validated","cancelled"],validated:["dry_run_ready","awaiting_connection","awaiting_scope","awaiting_approval","cancelled"],dry_run_ready:["awaiting_connection","awaiting_scope","awaiting_approval","ready","cancelled","expired"],awaiting_connection:["dry_run_ready","cancelled","expired"],awaiting_scope:["dry_run_ready","cancelled","expired"],awaiting_approval:["ready","cancelled","expired"],ready:["reserved","cancelled","expired"],reserved:["running","failed","cancelled"],running:["partial","completed","failed","cancelled"],partial:["completed","failed"],completed:[],failed:[],cancelled:[],expired:[]});
const CLASSIFICATION_RANK=Object.freeze({public:0,internal:1,confidential:2,restricted:3});
const SENSITIVE_KEYS=/(token|secret|password|credential|authorization|cookie|prompt|mail.*body|message.*body|file.*body|calendar.*body|raw.*content|oauth.*code|private.*key|client.*secret)/i;
const CREDENTIAL_VALUE=/(bearer\s+[a-z0-9._~+\/-]+=*|-----begin [a-z ]*private key-----|ya29\.[a-z0-9_-]+)/i;

export const EMPLOYEE_REGISTRY=Object.freeze({google_operations:Object.freeze({id:"google_operations",name:"Google Operations AI Employee",role:"Google Workspace業務を安全に支援するOperations担当",department:"Operations",responsibility:"Ownerが承認したGoogle Workspace業務のDry Runと実行準備",version:"1.1.0",maturity:"Conditional",provider:"google",externalExecution:false})});
const REQUIRED=["workspaceId","ownerId","aiEmployeeId","workflowId","taskId","correlationId","requestClass","capability","purpose","requestedAt","requestedBy","parameters","scopeRequirements","dataClassification","approvalRequirements","idempotencyKey","dryRun","maxApiCalls","maxRecords","maxDurationMs","costCeilingJpy","expectedOutputType"];

export function validateSafeMetadata(value,{depth=0,maxDepth=6,maxBytes=32768}={}){
  if(depth>maxDepth)return {safe:false,reasonCode:"METADATA_DEPTH_EXCEEDED"};
  let bytes;try{bytes=new TextEncoder().encode(JSON.stringify(value??null)).length;}catch{return {safe:false,reasonCode:"METADATA_NOT_SERIALIZABLE"};}
  if(bytes>maxBytes)return {safe:false,reasonCode:"METADATA_SIZE_EXCEEDED"};
  if(typeof value==="string")return value.length<=4096&&!CREDENTIAL_VALUE.test(value)?{safe:true}:{safe:false,reasonCode:"SENSITIVE_METADATA_REJECTED"};
  if(Array.isArray(value)){for(const item of value){const result=validateSafeMetadata(item,{depth:depth+1,maxDepth,maxBytes});if(!result.safe)return result;}return {safe:true};}
  if(value&&typeof value==="object"){for(const [key,item] of Object.entries(value)){if(SENSITIVE_KEYS.test(key))return {safe:false,reasonCode:"SENSITIVE_METADATA_REJECTED"};const result=validateSafeMetadata(item,{depth:depth+1,maxDepth,maxBytes});if(!result.safe)return result;}}
  return {safe:true};
}

export function validateEmployeeTask(input={}){const errors=[];for(const key of REQUIRED)if(input[key]===undefined||input[key]===null||input[key]==="")errors.push(`${key}_required`);if(input.aiEmployeeId&&!EMPLOYEE_REGISTRY[input.aiEmployeeId])errors.push("employee_unknown");if(!(input.dataClassification in CLASSIFICATION_RANK))errors.push("classification_invalid");if(input.dryRun!==true)errors.push("external_execution_locked");for(const key of ["maxApiCalls","maxRecords","maxDurationMs","costCeilingJpy"])if(!Number.isFinite(input[key])||input[key]<0)errors.push(`${key}_invalid`);for(const value of [input.parameters,input.scopeRequirements,input.approvalRequirements]){const safe=validateSafeMetadata(value);if(!safe.safe)errors.push(safe.reasonCode.toLowerCase());}return {valid:errors.length===0,errors:[...new Set(errors)],externalExecution:false};}
export function createEmployeeTask(input,now=input?.requestedAt){const v=validateEmployeeTask(input);if(!v.valid)return {ok:false,status:"blocked",errors:v.errors,externalExecution:false};return {ok:true,task:{...input,status:"validated",createdAt:now,updatedAt:now,retryCount:0,apiCalls:0,aiCalls:0,actualCostJpy:0,recordsProcessed:0,mock:true,externalExecution:false}};}
export function transitionEmployeeTask(task,next,at){if(!TASK_STATES.includes(next)||!TRANSITIONS[task?.status]?.includes(next))return {ok:false,reasonCode:"TASK_TRANSITION_FORBIDDEN"};return {ok:true,task:{...task,status:next,updatedAt:at}};}
export function evaluateQuota(task,usage={}){if(task.maxApiCalls>50||task.maxRecords>1000||task.maxDurationMs>30000)return {allowed:false,reasonCode:"TASK_CEILING_EXCEEDED"};if(Number(usage.apiCalls||0)+task.maxApiCalls>Number(usage.dailyCallLimit||100))return {allowed:false,reasonCode:"GOOGLE_QUOTA_BLOCKED"};if(Number(usage.retryCount||0)>1)return {allowed:false,reasonCode:"RETRY_LIMIT_REACHED"};return {allowed:true,reasonCode:"QUOTA_AVAILABLE",estimatedCalls:task.maxApiCalls,externalExecution:false};}

export function evaluateEmployeeRuntimeChain(input={}){
  const gates=[
    [input.ownerVerified===true,"OWNER_AUTH_REQUIRED"],
    [Boolean(input.workspaceId)&&input.workspaceId===input.sessionWorkspaceId,"WORKSPACE_MISMATCH"],
    [input.plannerReady===true,"PLANNER_NOT_READY"],
    [input.taskValidated===true,"TASK_NOT_VALIDATED"],
    [input.workflowReady===true,"WORKFLOW_NOT_READY"],
    [input.capabilityAllowed===true,"CAPABILITY_NOT_ALLOWED"],
    [input.permissionAllowed===true,"PERMISSION_NOT_ALLOWED"],
    [input.connectionReady===true,"PROVIDER_CONNECTION_REQUIRED"],
    [input.scopeReady===true,"PROVIDER_SCOPE_REQUIRED"],
    [input.classificationAllowed===true,"DATA_CLASSIFICATION_BLOCKED"],
    [input.approvalRequired!==true||input.approvalValid===true,"OWNER_APPROVAL_REQUIRED"],
    [input.quotaReserved===true,"GOOGLE_QUOTA_BLOCKED"],
    [input.providerPolicyAllowed===true,"PROVIDER_POLICY_BLOCKED"],
    [input.costGuardAllowed===true,"COST_GUARD_BLOCKED"],
    [input.costReservationReady===true,"COST_RESERVATION_REQUIRED"],
    [input.globalExecutionEnabled===true,"GLOBAL_EXECUTION_LOCKED"],
    [input.providerExecutionEnabled===true,"PROVIDER_EXECUTION_LOCKED"],
    [input.externalExecutionLocked===false,"EXTERNAL_EXECUTION_LOCKED"]
  ];
  const failed=gates.find(([allowed])=>!allowed);
  return failed?{allowed:false,status:"blocked",reasonCode:failed[1],externalExecution:false,googleApiRequests:0,aiProviderRequests:0}:{allowed:true,status:"ready",reasonCode:"RUNTIME_GATES_PASSED",externalExecution:true};
}

export function createHandoff({task,targetEmployeeId,targetCapabilityId,fields,classification,parentHandoffs=[],depth=1,metadata={}}){if(!task?.workspaceId||!EMPLOYEE_REGISTRY[task.aiEmployeeId]||!targetEmployeeId||!targetCapabilityId||!Array.isArray(fields)||!(classification in CLASSIFICATION_RANK))return {ok:false,reasonCode:"HANDOFF_INVALID"};if(targetEmployeeId===task.aiEmployeeId)return {ok:false,reasonCode:"HANDOFF_SELF_LOOP"};if(depth<1||depth>8||parentHandoffs.some(x=>x.targetEmployeeId===targetEmployeeId))return {ok:false,reasonCode:"HANDOFF_LOOP_OR_DEPTH"};if(CLASSIFICATION_RANK[classification]<CLASSIFICATION_RANK[task.dataClassification||"internal"])return {ok:false,reasonCode:"CLASSIFICATION_DOWNGRADE_FORBIDDEN"};if(!validateSafeMetadata(metadata).safe||fields.some(field=>SENSITIVE_KEYS.test(String(field))))return {ok:false,reasonCode:"SENSITIVE_METADATA_REJECTED"};if(["confidential","restricted"].includes(classification))return {ok:false,reasonCode:"HANDOFF_APPROVAL_REQUIRED"};return {ok:true,handoff:{workspaceId:task.workspaceId,sourceEmployeeId:task.aiEmployeeId,targetEmployeeId,targetCapabilityId,taskId:task.taskId,fields:[...fields],classification,status:"proposed",depth,metadata,rawContentIncluded:false,externalExecution:false}};}
export function aggregatePartialResults(results=[]){const succeeded=results.filter(x=>x.status==="success"),failed=results.filter(x=>x.status!=="success");return {status:failed.length?(succeeded.length?"partial":"failed"):"completed",services:results,partial:failed.length>0,warnings:failed.map(x=>`${x.service}:${x.errorClass||"unavailable"}`),mock:true,externalExecution:false};}
export function buildEmployeeOutput(task,input={}){return {status:input.status||"dry_run_ready",maturity:EMPLOYEE_REGISTRY[task.aiEmployeeId]?.maturity||"Locked",sourceProvider:EMPLOYEE_REGISTRY[task.aiEmployeeId]?.provider||null,capability:task.capability,workspaceId:task.workspaceId,taskId:task.taskId,workflowId:task.workflowId,correlationId:task.correlationId,dataFreshness:input.dataFreshness||"not_fetched",sourceIdentifiers:[...(input.sourceIdentifiers||[])],resultSummary:input.resultSummary||"Dry Runのみ。外部データは取得していません。",structuredData:input.structuredData||{},warnings:[...(input.warnings||[])],missingPermissions:[...(input.missingPermissions||[])],missingScopes:[...(input.missingScopes||[])],ownerActionRequired:input.ownerActionRequired||null,approvalRequired:Boolean(input.approvalRequired),estimatedCostJpy:task.costCeilingJpy,actualCostJpy:0,apiQuotaImpact:Number(input.apiQuotaImpact||0),recordsProcessed:0,partial:false,mock:true,errorClassification:null,retryable:false,completedAt:null,externalExecution:false};}
export function validateEmployeeApproval(approval,task,now=Date.now()){const s=approval?.snapshot;return Boolean(approval?.status==="approved"&&approval.oneTimeUse===true&&approval.used!==true&&Date.parse(approval.expiresAt)>now&&s?.workspaceId===task.workspaceId&&s?.aiEmployeeId===task.aiEmployeeId&&s?.workflowId===task.workflowId&&s?.capability===task.capability&&s?.idempotencyKey===task.idempotencyKey&&s?.requestHash===approval.requestHash);}
