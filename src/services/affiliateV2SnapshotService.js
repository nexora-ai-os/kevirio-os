import { AffiliateV2Error, mapRepositoryError } from "../domain/affiliateV2Contracts.js";
import { validateTruthValue } from "../domain/affiliateIntelligenceV2.js";

const ALLOWED_TYPES=new Set(["opportunity_score","swot","strategy","content_plan","forecast","brand_audit","duplicate_audit","ai_meeting"]);
export function createAffiliateV2SnapshotService(client){return{async saveAffiliateIntelligenceSnapshot({workspaceId,programId,snapshotType,payload,idempotencyKey}){
  if(!client?.rpc) throw new AffiliateV2Error("RPC_UNAVAILABLE",{operation:"save_snapshot",object:"affiliate_intelligence_snapshots"});
  if(!workspaceId||!programId||!ALLOWED_TYPES.has(snapshotType)||!payload||typeof payload!=="object"||!idempotencyKey||idempotencyKey.length<8) throw new AffiliateV2Error("VALIDATION_FAILED",{operation:"save_snapshot",object:"affiliate_intelligence_snapshots"});
  const truthClass=payload.truthClass||"Inference"; if(truthClass==="Actual") throw new AffiliateV2Error("VALIDATION_FAILED",{operation:"actual_snapshot_forbidden",object:"affiliate_intelligence_snapshots"});
  const checked=validateTruthValue({truthClass,generatedAt:payload.generatedAt,sourceData:payload.sourceReference,assumptions:payload.assumptions,confidence:payload.confidence,modelVersion:payload.modelVersion},{production:false});
  if(!checked.valid) throw new AffiliateV2Error("VALIDATION_FAILED",{operation:"snapshot_truth_metadata",object:"affiliate_intelligence_snapshots"});
  const rpcInput={generatedAt:payload.generatedAt,sourceReference:payload.sourceReference,assumptions:payload.assumptions,confidence:payload.confidence,modelVersion:payload.modelVersion,promptVersion:payload.promptVersion,promptHash:payload.promptHash,payload:payload.payload||{}};
  try{const {data,error}=await client.rpc("save_affiliate_intelligence_snapshot",{p_affiliate_program_id:programId,p_snapshot_type:snapshotType,p_truth_class:truthClass,p_input:rpcInput,p_idempotency_key:idempotencyKey});if(error)throw error;return Object.freeze({id:data,workspaceId,programId,snapshotType,truthClass,idempotencyKey,auditEvent:"affiliate_intelligence_snapshot_saved"});}
  catch(error){throw mapRepositoryError(error,{operation:"save_snapshot",object:"affiliate_intelligence_snapshots"});}
}};}
