import { createHash } from "node:crypto";
import { evaluateProviderCostGuard, loadProviderCostPolicy } from "../src/services/providerCostGuard.js";

const blocked=(reasonCode,extra={})=>({ok:false,status:"blocked",reasonCode,externalExecution:false,productionExecution:false,...extra});
export function promptHash(value){return createHash("sha256").update(String(value||"")).digest("hex");}
export async function executeProviderGateway(request,options={}){
  let runtime;
  try{runtime=await options.runtimeStore?.getRuntimeContext?.(request);}catch{return blocked("USAGE_UNAVAILABLE");}
  const policy=options.policy||runtime?.policy||loadProviderCostPolicy(options.env||process.env);
  const decision=evaluateProviderCostGuard(request,{policy,workspaceId:options.workspaceId,...runtime});if(!decision.allowed){await options.runtimeStore?.recordBlocked?.({request,reasonCode:decision.reasonCode}).catch(()=>{});return blocked(decision.reasonCode,{cost:{estimatedMaximumJpy:decision.estimatedCostJpy??null}});}
  let reservation;try{reservation=await options.runtimeStore.reserve({request,decision});}catch{return blocked("RESERVATION_FAILED");}if(!reservation?.reservationId)return blocked("RESERVATION_FAILED");
  const ledgerBase={workspaceId:request.workspaceId,workflowId:request.workflowId,aiEmployeeId:request.aiEmployeeId,provider:request.provider,model:request.model,purpose:request.purpose,requestClass:request.requestClass,estimatedInputTokens:request.estimatedInputTokens,estimatedOutputTokens:request.maxOutputTokens,reservedCostJpy:decision.reservedCostJpy,currency:"JPY",approvalId:request.approval?.id||null,idempotencyKey:request.idempotencyKey,promptVersion:request.promptVersion,promptHash:promptHash(request.promptMaterial),retryCount:request.retryCount||0};
  try{await options.runtimeStore.appendLedger({...ledgerBase,status:"reserved"});}catch{await options.runtimeStore.release(reservation).catch(()=>{});return blocked("LEDGER_WRITE_FAILED");}
  try{const started=Date.now();const result=await options.dispatch({reservation,decision});await options.runtimeStore.finalize({reservation,result,latencyMs:Date.now()-started});await options.runtimeStore.appendLedger({...ledgerBase,status:result?.ok?"completed":"failed",actualInputTokens:result?.usage?.inputTokens??null,actualOutputTokens:result?.usage?.outputTokens??null,actualCostJpy:result?.cost?.actualJpy??decision.estimatedCostJpy,errorClass:result?.ok?null:result?.errorClass||"provider"});return {...result,externalExecution:false,productionExecution:false};}catch{await options.runtimeStore.fail({reservation,errorClass:"provider"}).catch(()=>{});await options.runtimeStore.appendLedger({...ledgerBase,status:"failed",errorClass:"provider"}).catch(()=>{});return blocked("PROVIDER_GATEWAY_FAILED");}
}
export function createLockedRuntimeStore(){return {async getRuntimeContext(){return {usageAvailable:false,ledgerAvailable:false};}};}
