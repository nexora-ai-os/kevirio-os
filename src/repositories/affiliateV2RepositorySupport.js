import { AffiliateV2Error, mapRepositoryError, normalizeLimit } from "../domain/affiliateV2Contracts.js";

export const COLUMNS = Object.freeze({
  affiliate_products:"id,workspace_id,affiliate_program_id,name,model_name,price_minor,currency,lifecycle_status,truth_class,confidence,source_reference,evidence_candidate_id,safe_metadata,created_at,updated_at,archived_at",
  affiliate_product_sources:"id,workspace_id,product_id,source_type,source_reference,attribution,observed_at,lifecycle_status,evidence_candidate_id,created_at,updated_at,archived_at",
  affiliate_research_entities:"id,workspace_id,affiliate_program_id,entity_type,name,lifecycle_status,truth_class,confidence,source_reference,attributes,created_at,updated_at,archived_at",
  affiliate_experiments:"id,workspace_id,affiliate_program_id,title,hypothesis,lifecycle_status,result_truth_class,result_summary,approval_request_id,evidence_candidate_id,created_at,updated_at,archived_at",
  affiliate_intelligence_snapshots:"id,workspace_id,affiliate_program_id,snapshot_type,version,lifecycle_status,truth_class,generated_at,source_reference,assumptions,confidence,model_version,payload,created_at,updated_at,archived_at",
  affiliate_risk_findings:"id,workspace_id,affiliate_program_id,snapshot_id,finding_type,classification,title,rationale,source_reference,lifecycle_status,owner_decision_id,created_at,updated_at,archived_at",
  affiliate_alerts:"id,workspace_id,affiliate_program_id,risk_finding_id,severity,alert_code,summary,lifecycle_status,detected_at,resolved_at,created_at,updated_at,archived_at",
  affiliate_daily_briefs:"id,workspace_id,brief_date,rule_version,action_count,decision_ids,summary,truth_class,generated_at,created_at,updated_at,archived_at",
  reusable_business_assets:"id,workspace_id,source_content_asset_id,asset_type,title,version,maturity,ownership,license_classification,internal_reuse,content_reference,safe_metadata,created_at,updated_at,archived_at",
});

export function createReadSupport(client){
  if(!client?.from) throw new AffiliateV2Error("RPC_UNAVAILABLE",{operation:"client_required",object:"repository"});
  const list=async(table,workspaceId,{filters={},order="updated_at",ascending=false,limit=50}={})=>{
    if(!workspaceId) throw new AffiliateV2Error("VALIDATION_FAILED",{operation:"workspace_required",object:table});
    try { let query=client.from(table).select(COLUMNS[table]).eq("workspace_id",workspaceId); for(const [key,value] of Object.entries(filters)) if(value!==undefined&&value!==null&&value!=="") query=query.eq(key,value); query=query.order(order,{ascending}).limit(normalizeLimit(limit)); const {data,error}=await query; if(error) throw error; return data||[]; }
    catch(error){throw mapRepositoryError(error,{operation:"list",object:table});}
  };
  const one=async(table,workspaceId,id,mapper)=>{const rows=await list(table,workspaceId,{filters:{id},limit:1}); if(!rows[0]) throw new AffiliateV2Error("NOT_FOUND",{operation:"get",object:table}); return mapper(rows[0]);};
  return {list,one};
}
