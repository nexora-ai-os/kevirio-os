import test from "node:test";
import assert from "node:assert/strict";
import { deriveNextOwnerAction, validateAffiliateProgram } from "../../src/domain/affiliateIntelligence.js";
test("offer to preparation to approval flow is deterministic",()=>{
  const offer={id:"offer-1"};
  assert.equal(deriveNextOwnerAction({offers:[offer]}).stage,"registered");
  const program={id:"program-1",offer_id:"offer-1",status:"content_plan"};
  assert.equal(deriveNextOwnerAction({offers:[offer],programs:[program]}).stage,"content_plan");
  assert.equal(deriveNextOwnerAction({offers:[offer],programs:[program],operations:[{offer_id:"offer-1",campaign_id:"c",status:"owner_artifact_approval"}]}).stage,"owner_approval");
});
test("complete preparation requires Owner confirmation",()=>assert.equal(validateAffiliateProgram({aspName:"ASP",advertiserName:"Advertiser",programName:"Program",commissionRate:7,currency:"JPY",conversionConditions:"Confirmed purchase",disclosureRequirements:"Ad disclosure",prohibitedClaims:"False claims",targetAudience:"Adults",claimPlan:"Evidence-led",plannedChannels:"Owned media",evidencePlan:"Commission statement",ownerConfirmed:false},9).valid,false));
