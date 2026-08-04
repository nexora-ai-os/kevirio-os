import { inspectOwnerWorkspace } from "../services/workspaceBootstrapService.js";

export function createOfferOperationsRepository(client){
  const withDeadline=async(request)=>{let timer;try{return await Promise.race([Promise.resolve(request),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error("OPERATIONS_TIMEOUT")),12000);})]);}finally{clearTimeout(timer);}};
  const requireClient=()=>{if(!client?.from||!client?.rpc)throw new Error("OPERATIONS_PROVIDER_REQUIRED");};
  const command=async(name,args,failureContext=null)=>{requireClient();const {data,error}=await withDeadline(client.rpc(name,args));if(error){if(failureContext?.operationId){try{await withDeadline(client.rpc("record_operation_failure",{p_operation_id:failureContext.operationId,p_operation:name,p_error_code:"COMMAND_REJECTED",p_retryable:false,p_owner_action:failureContext.ownerAction||"入力と現在Stepを確認してください。"}));}catch{/* Failure telemetry must never mask the original safe error. */}}throw new Error("OPERATIONS_COMMAND_FAILED");}return data;};
  const list=async(table,workspaceId,optional=false)=>{requireClient();if(!workspaceId)throw new Error("WORKSPACE_REQUIRED");const {data,error}=await withDeadline(client.from(table).select("*").eq("workspace_id",workspaceId));if(error&&optional)return [];if(error)throw new Error("OPERATIONS_READ_FAILED");return data||[];};
  const loadContext=async(verifiedSession=null)=>{const value=await inspectOwnerWorkspace(client,verifiedSession);if(!value.ok||value.status!=="ready")throw new Error("OWNER_WORKSPACE_REQUIRED");return value;};
  const loadSnapshot=async(workspaceId)=>{
    const [offers,operations,connections,performance,costs,learnings,failures,approvals,packages,revenue,evidence,programs,materials,publications,affiliatePerformance]=await Promise.all([
      "affiliate_offers","offer_operations","platform_connections","performance_records","operating_cost_records","learning_records","operation_failures","approval_requests","execution_packages","revenue_records",
    ].map((table)=>list(table,workspaceId)).concat([
      list("evidence_candidates",workspaceId),list("affiliate_programs",workspaceId,true),list("affiliate_materials",workspaceId,true),
      list("affiliate_publications",workspaceId,true),list("affiliate_performance_records",workspaceId,true),
    ]));
    return {offers,operations,connections,performance,costs,learnings,failures,approvals,packages,revenue,evidence,programs,materials,publications,affiliatePerformance};
  };
  return {loadContext,loadSnapshot,
    registerOffer:(workspaceId,brandId,key,offer)=>command("register_affiliate_offer",{p_workspace_id:workspaceId,p_brand_id:brandId,p_idempotency_key:key,p_offer:offer}),
    prepareOperation:(offerId,key)=>command("prepare_offer_operation",{p_offer_id:offerId,p_idempotency_key:key}),
    decideApproval:(id,snapshot)=>command("decide_approval",{p_approval_request_id:id,p_decision:"approve",p_reason:"Owner verified the immutable affiliate content snapshot.",p_decision_snapshot:snapshot}),
    recordPackageAccess:(id,action)=>command("record_manual_package_access",{p_package_id:id,p_action:action}),
    recordPerformance:(id,input)=>command("record_offer_performance",{p_operation_id:id,p_input:input},{operationId:id,ownerAction:"Performance入力と重複Referenceを確認してください。"}),
    recordCost:(id,input)=>command("record_operating_cost",{p_operation_id:id,p_input:input},{operationId:id,ownerAction:"Cost区分、minor unit、通貨、Referenceを確認してください。"}),
    generateLearning:(id)=>command("generate_operation_learning",{p_operation_id:id},{operationId:id,ownerAction:"先にPerformanceを登録してください。"}),
  };
}
