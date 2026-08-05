import { AffiliateV2Error } from "../domain/affiliateV2Contracts.js";
import { validateAiExecution } from "../domain/affiliateIntelligenceV2.js";

export const AFFILIATE_AI_OPERATIONS=Object.freeze(["generateOpportunityAssessment","generatePriorityRecommendation","generateComplianceReview","generateOwnerDailyBrief","generateLearningSummary","generateAIEmployeeMeeting"]);
const requireMetadata=(operation,metadata={})=>{
  const input={role:metadata.role||"Affiliate Strategist",retryCount:metadata.retryPolicy?.maxRetries??0,meetingRounds:operation==="generateAIEmployeeMeeting"?(metadata.meetingRounds??1):0,externalExecution:false,promptVersion:metadata.promptVersion,promptHash:metadata.inputHash,model:metadata.model,temperature:metadata.temperature};
  const checked=validateAiExecution(input); if(!metadata.promptId||!metadata.outputSchema||metadata.permission!=="local_draft_only"||!checked.valid) throw new AffiliateV2Error("VALIDATION_FAILED",{operation,object:"ai_orchestration"});
  if((metadata.retryPolicy?.maxRetries??0)>1) throw new AffiliateV2Error("VALIDATION_FAILED",{operation:"retry_limit",object:"ai_orchestration"});
  return Object.freeze({...metadata,retryPolicy:Object.freeze({maxRetries:metadata.retryPolicy?.maxRetries??0}),externalExecution:false});
};
export function createAffiliateV2AiOrchestration(adapter=null){
  const execute=async(operation,input,metadata)=>{
    const contract=requireMetadata(operation,metadata);
    if(!adapter?.generate) throw new AffiliateV2Error("NOT_CONFIGURED",{operation,object:"ai_provider"});
    if(adapter.locked!==false) throw new AffiliateV2Error("LOCKED",{operation,object:"ai_provider"});
    try { const result=await adapter.generate({operation,input,metadata:contract}); if(!result?.ok) throw new AffiliateV2Error(result?.code==="RATE_LIMITED"?"RATE_LIMITED":"PROVIDER_ERROR",{operation,object:"ai_provider"}); return Object.freeze({status:"draft",truthClass:"Inference",output:result.output,costEstimate:contract.costEstimate??null,auditMetadata:Object.freeze({promptId:contract.promptId,promptVersion:contract.promptVersion,inputHash:contract.inputHash,model:contract.model})}); }
    catch(error){if(error instanceof AffiliateV2Error)throw error;throw new AffiliateV2Error("PROVIDER_ERROR",{operation,object:"ai_provider"});}
  };
  return Object.freeze(Object.fromEntries(AFFILIATE_AI_OPERATIONS.map((operation)=>[operation,(input,metadata)=>execute(operation,input,metadata)])));
}
