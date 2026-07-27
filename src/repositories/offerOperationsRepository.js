import { inspectOwnerWorkspace } from "../services/workspaceBootstrapService.js";

export function createOfferOperationsRepository(client){
  const requireClient=()=>{if(!client?.from||!client?.rpc)throw new Error("OPERATIONS_PROVIDER_REQUIRED");};
  const command=async(name,args)=>{requireClient();const {data,error}=await client.rpc(name,args);if(error)throw new Error("OPERATIONS_COMMAND_FAILED");return data;};
  const list=async(table,workspaceId)=>{requireClient();if(!workspaceId)throw new Error("WORKSPACE_REQUIRED");const {data,error}=await client.from(table).select("*").eq("workspace_id",workspaceId);if(error)throw new Error("OPERATIONS_READ_FAILED");return data||[];};
  const loadContext=async()=>{const value=await inspectOwnerWorkspace(client);if(!value.ok||value.status!=="ready")throw new Error("OWNER_WORKSPACE_REQUIRED");return value;};
  const loadSnapshot=async(workspaceId)=>{
    const [offers,operations,connections,performance,costs,learnings,failures,approvals,packages,revenue]=await Promise.all([
      "affiliate_offers","offer_operations","platform_connections","performance_records","operating_cost_records","learning_records","operation_failures","approval_requests","execution_packages","revenue_records",
    ].map((table)=>list(table,workspaceId)));
    return {offers,operations,connections,performance,costs,learnings,failures,approvals,packages,revenue};
  };
  return {loadContext,loadSnapshot,
    registerOffer:(workspaceId,brandId,key,offer)=>command("register_affiliate_offer",{p_workspace_id:workspaceId,p_brand_id:brandId,p_idempotency_key:key,p_offer:offer}),
    prepareOperation:(offerId,key)=>command("prepare_offer_operation",{p_offer_id:offerId,p_idempotency_key:key}),
    decideApproval:(id,snapshot)=>command("decide_approval",{p_approval_request_id:id,p_decision:"approve",p_reason:"Owner verified the immutable affiliate content snapshot.",p_decision_snapshot:snapshot}),
    recordPackageAccess:(id,action)=>command("record_manual_package_access",{p_package_id:id,p_action:action}),
    recordPerformance:(id,input)=>command("record_offer_performance",{p_operation_id:id,p_input:input}),
    recordCost:(id,input)=>command("record_operating_cost",{p_operation_id:id,p_input:input}),
    generateLearning:(id)=>command("generate_operation_learning",{p_operation_id:id}),
  };
}
