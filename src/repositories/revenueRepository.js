import { inspectOwnerWorkspace } from "../services/workspaceBootstrapService.js";

const SAFE_ERRORS = Object.freeze({
  read: "REPOSITORY_READ_FAILED",
  write: "REPOSITORY_WRITE_FAILED",
  rpc: "REPOSITORY_COMMAND_FAILED",
});
const REMOTE_TIMEOUT_MS=12000;
const withDeadline=async(request)=>{let timer;try{return await Promise.race([Promise.resolve(request),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error("REPOSITORY_TIMEOUT")),REMOTE_TIMEOUT_MS);})]);}finally{clearTimeout(timer);}};

export function createRevenueRepository(client) {
  const requireDataClient=()=>{if(!client?.from) throw new Error("REPOSITORY_PROVIDER_REQUIRED");};
  const requireCommandClient=()=>{if(!client?.rpc) throw new Error("REPOSITORY_PROVIDER_REQUIRED");};
  const list=async(table,workspaceId)=>{requireDataClient(); if(!workspaceId) throw new Error("WORKSPACE_REQUIRED"); const {data,error}=await withDeadline(client.from(table).select("*").eq("workspace_id",workspaceId)); if(error) throw new Error(SAFE_ERRORS.read); return data||[];};
  const insert=async(table,workspaceId,value)=>{if(!workspaceId || value.workspace_id!==workspaceId) throw new Error("WORKSPACE_MISMATCH"); requireDataClient(); const {data,error}=await client.from(table).insert(value).select().single(); if(error) throw new Error("REPOSITORY_WRITE_FAILED"); return data;};
  const command=async(name,args)=>{requireCommandClient();const {data,error}=await withDeadline(client.rpc(name,args));if(error) throw new Error(SAFE_ERRORS.rpc);return data;};
  const loadContext=async(verifiedSession=null)=>{const result=await inspectOwnerWorkspace(client,verifiedSession);if(!result.ok || result.status!=="ready") throw new Error("OWNER_WORKSPACE_REQUIRED");return result;};
  const loadSnapshot=async(workspaceId)=>{
    const [opportunities,campaigns,tasks,artifacts,approvals,evidence,revenue,workflows,executionPackages]=await Promise.all([
      list("opportunities",workspaceId),list("campaigns",workspaceId),list("tasks",workspaceId),
      list("artifacts",workspaceId),list("approval_requests",workspaceId),list("evidence_candidates",workspaceId),
      list("revenue_records",workspaceId),list("workflow_runs",workspaceId),command("retrieve_manual_execution_packages",{p_workspace_id:workspaceId}),
    ]);
    return {opportunities,campaigns,tasks,artifacts,approvals,evidence,revenue,workflows,executionPackages:executionPackages||[]};
  };
  return {
    loadContext,
    loadSnapshot,
    listOpportunities:(workspaceId)=>list("opportunities",workspaceId),
    listCampaigns:(workspaceId)=>list("campaigns",workspaceId),
    listPendingApprovals:(workspaceId)=>list("approval_requests",workspaceId),
    listEvidence:(workspaceId)=>list("evidence_candidates",workspaceId),
    listActualRevenue:(workspaceId)=>list("revenue_records",workspaceId),
    createOpportunity:(workspaceId,value)=>insert("opportunities",workspaceId,value),
    createCampaign:(workspaceId,value)=>insert("campaigns",workspaceId,value),
    createRevenueCandidate:(workspaceId,brandId,idempotencyKey,candidate)=>command("create_revenue_candidate",{
      p_workspace_id:workspaceId,p_brand_id:brandId,p_idempotency_key:idempotencyKey,p_candidate:candidate,
    }),
    decideApproval:(approvalRequestId,decision,reason,snapshot={})=>command("decide_approval",{
      p_approval_request_id:approvalRequestId,p_decision:decision,p_reason:reason,p_decision_snapshot:snapshot,
    }),
    generateManualPackage:(approvalRequestId)=>command("generate_manual_execution_package",{p_approval_request_id:approvalRequestId}),
    recordManualPackageAccess:(packageId,action)=>command("record_manual_package_access",{p_package_id:packageId,p_action:action}),
    registerEvidence:(workspaceId,campaignId,value)=>command("register_revenue_evidence",{
      p_workspace_id:workspaceId,p_campaign_id:campaignId,p_source_type:value.sourceType,
      p_source_reference:value.sourceReference,p_amount_minor:value.amountMinor,p_cost_amount_minor:value.costAmountMinor,
      p_currency:value.currency,p_occurred_at:value.occurredAt,p_note:value.note || "",p_sensitivity_level:"financial_data",
    }),
    verifyRevenue:(evidenceId)=>command("verify_evidence_and_record_revenue",{p_evidence_id:evidenceId}),
  };
}
