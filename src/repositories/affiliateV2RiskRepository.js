import { mapAlertRow, mapRiskRow } from "../domain/affiliateV2Contracts.js";
import { createReadSupport } from "./affiliateV2RepositorySupport.js";
export function createAffiliateV2RiskRepository(client){const r=createReadSupport(client);return{
  listRiskFindings:async(workspaceId,programId,filters={})=>(await r.list("affiliate_risk_findings",workspaceId,{filters:{affiliate_program_id:programId,classification:filters.classification,lifecycle_status:filters.status},limit:filters.limit})).map(mapRiskRow),
  getOpenCriticalRiskCount:async(workspaceId,programId)=>(await r.list("affiliate_risk_findings",workspaceId,{filters:{affiliate_program_id:programId,classification:"BLOCKED",lifecycle_status:"open"},limit:100})).length,
  listAlerts:async(workspaceId,filters={})=>(await r.list("affiliate_alerts",workspaceId,{filters:{affiliate_program_id:filters.programId,severity:filters.severity,lifecycle_status:filters.status},order:"detected_at",limit:filters.limit})).map(mapAlertRow),
  getUnreadAlertCount:async(workspaceId)=>(await r.list("affiliate_alerts",workspaceId,{filters:{lifecycle_status:"open"},limit:100})).length,
  getCriticalAlerts:async(workspaceId)=>(await r.list("affiliate_alerts",workspaceId,{filters:{severity:"Critical",lifecycle_status:"open"},order:"detected_at",limit:100})).map(mapAlertRow),
};}
