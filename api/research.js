import { resolveVerifiedOwnerWorkspaceContext } from "../server/verifiedOwnerContext.js";
import { createSupabaseServerClient, createSupabaseUserServerClient } from "../server/supabaseServerClient.js";
import { validateResearchExecution } from "../server/researchExecutionContract.js";

const blocked = (reasonCode, status = 403) => ({ status, body: { ok:false, reasonCode, paidAiJpy:0, externalExecution:"LOCKED", autonomyMax:"L2_PREPARE" } });
export default async function handler(req,res) {
  if (req.method !== "POST") { const out=blocked("METHOD_NOT_ALLOWED",405); return res.status(out.status).json(out.body); }
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const service = createSupabaseServerClient(), userClient = createSupabaseUserServerClient(req);
  if (!service || !userClient) { const out=blocked("RESEARCH_SERVER_UNAVAILABLE",503); return res.status(out.status).json(out.body); }
  const verified = await resolveVerifiedOwnerWorkspaceContext(req, body.workspaceId, { client:service });
  if (!verified.ok) { const out=blocked(verified.reasonCode); return res.status(out.status).json(out.body); }
  const personal = await service.from("account_personal_workspaces").select("workspace_id").eq("user_id",verified.context.ownerId).eq("workspace_id",verified.context.workspaceId).maybeSingle();
  if (personal.error || !personal.data) { const out=blocked("PERSONAL_WORKSPACE_REQUIRED"); return res.status(out.status).json(out.body); }
  if (body.paidAi === true || body.externalExecution === true || ["L3_EXECUTE","L4_AUTONOMOUS"].includes(body.autonomyLevel)) { const out=blocked("RESEARCH_POLICY_DENIED"); return res.status(out.status).json(out.body); }
  const contract = validateResearchExecution(body);
  if (!contract.ok) return res.status(400).json({ ...blocked("RESEARCH_CONTRACT_INVALID",400).body, errors:contract.errors });
  const sourceResult = await service.rpc("register_research_source", { p_owner_user_id:verified.context.ownerId,p_canonical_url:contract.source.canonicalUrl,p_source_name:contract.source.sourceName,p_source_domain:contract.source.sourceDomain,p_country_code:contract.source.countryCode,p_region:contract.source.region,p_source_type:contract.source.sourceType,p_reliability_class:contract.source.reliabilityClass,p_cost_class:contract.source.costClass,p_limitations:contract.source.limitations,p_audit_metadata:{route:"AUTHENTICATED_RESEARCH",paid_ai_jpy:0,external_execution:"LOCKED"} });
  if (sourceResult.error) { const out=blocked("RESEARCH_SOURCE_WRITE_FAILED",503); return res.status(out.status).json(out.body); }
  const findingIds=[]; const opportunityIds=[];
  for (const finding of contract.findings) {
    const recorded=await service.rpc("record_research_finding",{p_owner_user_id:verified.context.ownerId,p_source_id:sourceResult.data,p_domain:finding.domain,p_market:finding.market||null,p_country_code:finding.countryCode||null,p_language_code:finding.languageCode||null,p_observed_at:finding.observedAt,p_freshness_expires_at:finding.freshnessExpiresAt||null,p_statement:finding.statement,p_truth_class:finding.truthClass,p_confidence:finding.confidence??null,p_provenance:{...finding.provenance,route:"AUTHENTICATED_RESEARCH",fact_vs_inference:finding.truthClass},p_supersedes_id:finding.supersedesId||null});
    if(recorded.error){const out=blocked("RESEARCH_FINDING_WRITE_FAILED",503);return res.status(out.status).json(out.body);} findingIds.push(recorded.data); if(finding.domain==="OPPORTUNITY")opportunityIds.push(recorded.data);
  }
  const linkIds=[];
  for(const opportunityId of opportunityIds) for(const link of contract.links){const linked=await userClient.rpc("link_canonical_domain_objects",{p_from_type:"GLOBAL_OPPORTUNITY",p_from_id:opportunityId,p_to_type:link.targetType,p_to_id:link.targetId,p_relation_type:link.relationType||"RELATES_TO",p_provenance:{source:"GLOBAL_INTELLIGENCE",finding_id:opportunityId,paid_ai_jpy:0,external_execution:"LOCKED"}});if(linked.error){const out=blocked("RESEARCH_LINK_FAILED",409);return res.status(out.status).json(out.body);}linkIds.push(linked.data);}
  const actionIds=[];
  for(const opportunityId of opportunityIds){const action=await userClient.rpc("prepare_internal_action",{p_employee_id:"market_intelligence",p_target_type:"GLOBAL_OPPORTUNITY",p_target_id:opportunityId,p_action_type:"FIT_EVALUATION_PREPARE",p_autonomy_level:"L2_PREPARE",p_risk_class:"LOW",p_policy_approval:"AUTO_LOW_RISK",p_payload:{idempotency_key:`research:fit:${opportunityId}`,description:"Evaluate fit and prepare an internal recommendation.",paid_ai_jpy:0,external_execution:"LOCKED"}});if(action.error){const out=blocked("RESEARCH_ACTION_FAILED",409);return res.status(out.status).json(out.body);}actionIds.push(action.data);}
  return res.status(200).json({ok:true,sourceId:sourceResult.data,findingIds,opportunityIds,linkIds,actionIds,paidAiJpy:0,externalExecution:"LOCKED",autonomyMax:"L2_PREPARE"});
}
