import { mapExperimentRow, mapResearchRow, mapSnapshotRow } from "../domain/affiliateV2Contracts.js";
import { createReadSupport } from "./affiliateV2RepositorySupport.js";
export function createAffiliateV2IntelligenceRepository(client){const r=createReadSupport(client);return{
  listResearchEntities:async(workspaceId,programId,filters={})=>(await r.list("affiliate_research_entities",workspaceId,{filters:{affiliate_program_id:programId,entity_type:filters.entityType,lifecycle_status:filters.status,truth_class:filters.truthClass},limit:filters.limit})).map(mapResearchRow),
  getResearchEntity:(workspaceId,entityId)=>r.one("affiliate_research_entities",workspaceId,entityId,mapResearchRow),
  listExperiments:async(workspaceId,programId,filters={})=>(await r.list("affiliate_experiments",workspaceId,{filters:{affiliate_program_id:programId,lifecycle_status:filters.status,result_truth_class:filters.truthClass},limit:filters.limit})).map(mapExperimentRow),
  getExperiment:(workspaceId,experimentId)=>r.one("affiliate_experiments",workspaceId,experimentId,mapExperimentRow),
  listSnapshots:async(workspaceId,programId,snapshotType)=>(await r.list("affiliate_intelligence_snapshots",workspaceId,{filters:{affiliate_program_id:programId,snapshot_type:snapshotType},order:"version",limit:100})).map(mapSnapshotRow),
  getLatestSnapshot:async(workspaceId,programId,snapshotType)=>{const rows=await r.list("affiliate_intelligence_snapshots",workspaceId,{filters:{affiliate_program_id:programId,snapshot_type:snapshotType},order:"version",limit:1});return rows[0]?mapSnapshotRow(rows[0]):null;},
};}
