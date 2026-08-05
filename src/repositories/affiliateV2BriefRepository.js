import { mapBriefRow } from "../domain/affiliateV2Contracts.js";
import { createReadSupport } from "./affiliateV2RepositorySupport.js";
export function createAffiliateV2BriefRepository(client){const r=createReadSupport(client);return{
  getLatestDailyBrief:async(workspaceId)=>{const rows=await r.list("affiliate_daily_briefs",workspaceId,{filters:{lifecycle_status:"active"},order:"brief_date",limit:1});return rows[0]?mapBriefRow(rows[0]):null;},
  getDailyBriefByDate:async(workspaceId,date)=>{const rows=await r.list("affiliate_daily_briefs",workspaceId,{filters:{brief_date:date},order:"generated_at",limit:1});return rows[0]?mapBriefRow(rows[0]):null;},
};}
