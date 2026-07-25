export function createRevenueRepository(client) {
  const requireClient=()=>{if(!client?.from) throw new Error("REPOSITORY_PROVIDER_REQUIRED");};
  const list=async(table,workspaceId)=>{requireClient(); if(!workspaceId) throw new Error("WORKSPACE_REQUIRED"); const {data,error}=await client.from(table).select("*").eq("workspace_id",workspaceId); if(error) throw new Error("REPOSITORY_READ_FAILED"); return data||[];};
  const insert=async(table,workspaceId,value)=>{requireClient(); if(!workspaceId || value.workspace_id!==workspaceId) throw new Error("WORKSPACE_MISMATCH"); const {data,error}=await client.from(table).insert(value).select().single(); if(error) throw new Error("REPOSITORY_WRITE_FAILED"); return data;};
  return {
    listOpportunities:(workspaceId)=>list("opportunities",workspaceId),
    listCampaigns:(workspaceId)=>list("campaigns",workspaceId),
    listPendingApprovals:(workspaceId)=>list("approval_requests",workspaceId),
    listEvidence:(workspaceId)=>list("evidence_candidates",workspaceId),
    listActualRevenue:(workspaceId)=>list("revenue_records",workspaceId),
    createOpportunity:(workspaceId,value)=>insert("opportunities",workspaceId,value),
    createCampaign:(workspaceId,value)=>insert("campaigns",workspaceId,value),
  };
}
