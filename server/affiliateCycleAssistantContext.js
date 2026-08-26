const WAITING = "WAITING_FOR_REAL_EXTERNAL_RESULT";

const first = (rows = []) => rows[0] || null;
const count = (rows = []) => rows.length;

export function isAffiliateCycleStatusQuery(text = "") {
  return /(?:どうなって|次(?:に|何)|投稿した|公開した|成果|売上|収益|publication|performance|candidate|evidence|actual)/i.test(String(text));
}

export async function loadAffiliateCycleAssistantContext(client, { workspaceId, ownerId, programId }) {
  const programResult = await client.from("affiliate_program_master")
    .select("id,program_name,program_status,next_action")
    .eq("id", programId).eq("workspace_id", workspaceId).eq("created_by", ownerId).maybeSingle();
  if (programResult.error || !programResult.data) throw new Error("AFFILIATE_PROGRAM_CONTEXT_NOT_FOUND");

  const [strategyResult, contentResult, publicationResult, performanceResult, candidateResult, evidenceResult, actualResult] = await Promise.all([
    client.from("affiliate_strategies").select("id,source_research_id,status,version").eq("workspace_id", workspaceId).eq("owner_user_id", ownerId).eq("affiliate_program_id", programId).order("updated_at", { ascending: false }).limit(1),
    client.from("personal_operational_records").select("id,title,lifecycle_status,version,payload").eq("workspace_id", workspaceId).eq("data_owner_id", ownerId).eq("record_type", "CONTENT").contains("payload", { affiliate_program_id: programId }).neq("lifecycle_status", "DELETED").order("updated_at", { ascending: false }).limit(1),
    client.from("affiliate_cycle_publications").select("id,content_id,strategy_id,research_id,execution_status,published_at,version").eq("workspace_id", workspaceId).eq("owner_user_id", ownerId).eq("affiliate_program_id", programId).order("created_at", { ascending: false }),
    client.from("affiliate_cycle_performance").select("id,publication_id,clicks,conversions,pending_reward_minor,confirmed_reward_minor,rejected_reward_minor,truth_class,observed_at").eq("workspace_id", workspaceId).eq("owner_user_id", ownerId).eq("affiliate_program_id", programId).order("observed_at", { ascending: false }),
    client.from("affiliate_revenue_candidates").select("id,publication_id,performance_id,status,reward_state,evidence_status,amount_minor,currency").eq("workspace_id", workspaceId).eq("owner_user_id", ownerId).eq("affiliate_program_id", programId).order("created_at", { ascending: false }),
    client.from("affiliate_revenue_evidence").select("id,candidate_id,verification_status,evidence_type").eq("workspace_id", workspaceId).eq("owner_user_id", ownerId).eq("affiliate_program_id", programId).order("created_at", { ascending: false }),
    client.from("affiliate_actual_revenue_extensions").select("id,candidate_id,evidence_id,currency,gross_amount_minor,recognized_at").eq("workspace_id", workspaceId).eq("owner_user_id", ownerId).eq("affiliate_program_id", programId).order("recognized_at", { ascending: false }),
  ]);
  const results = [strategyResult, contentResult, publicationResult, performanceResult, candidateResult, evidenceResult, actualResult];
  if (results.some(result => result.error)) throw new Error("AFFILIATE_CYCLE_CONTEXT_UNAVAILABLE");

  const strategy = first(strategyResult.data);
  let research = null;
  if (strategy?.source_research_id) {
    const researchResult = await client.from("research_findings").select("id,status,truth_class,confidence,observed_at").eq("workspace_id", workspaceId).eq("owner_user_id", ownerId).eq("id", strategy.source_research_id).maybeSingle();
    if (researchResult.error || !researchResult.data) throw new Error("AFFILIATE_RESEARCH_CONTEXT_INTEGRITY_FAILED");
    research = researchResult.data;
  }

  const content = first(contentResult.data);
  const executionState = content?.payload?.execution?.state || "UNKNOWN";
  const improvement = content?.payload?.analytics?.recommendation || content?.payload?.improvement || WAITING;
  return Object.freeze({
    program: Object.freeze({ id: programResult.data.id, name: programResult.data.program_name, status: programResult.data.program_status || "UNKNOWN" }),
    research: research ? Object.freeze({ id: research.id, status: research.status || "UNKNOWN", truthClass: research.truth_class || "UNKNOWN" }) : null,
    strategy: strategy ? Object.freeze({ id: strategy.id, status: strategy.status || "UNKNOWN", researchId: strategy.source_research_id || null }) : null,
    content: content ? Object.freeze({ id: content.id, status: content.lifecycle_status || "UNKNOWN", executionState }) : null,
    publication: Object.freeze({ count: count(publicationResult.data), latestStatus: first(publicationResult.data)?.execution_status || "NOT_RECORDED" }),
    performance: Object.freeze({ count: count(performanceResult.data), latest: first(performanceResult.data) || null }),
    revenueCandidate: Object.freeze({ count: count(candidateResult.data), latestStatus: first(candidateResult.data)?.status || "NONE" }),
    evidence: Object.freeze({ count: count(evidenceResult.data), latestStatus: first(evidenceResult.data)?.verification_status || "NONE" }),
    actualRevenue: Object.freeze({ count: count(actualResult.data), latest: first(actualResult.data) || null }),
    improvement: String(improvement || WAITING),
    nextAction: programResult.data.next_action || (count(publicationResult.data) === 0 && content ? "Owner reviews Content and manually publishes" : "Review the latest canonical cycle state"),
    truth: Object.freeze({ paidAiJpy: 0, paidFallback: "OFF", externalExecution: "LOCKED", aiOutputIsEvidence: false }),
  });
}

export function formatAffiliateCycleContext(cycle) {
  const perf = cycle.performance.latest;
  return [
    `Exact Affiliate Program: ${cycle.program.name} (${cycle.program.id})`,
    `Program status: ${cycle.program.status}`,
    `Research: ${cycle.research ? cycle.research.status : "UNKNOWN"}`,
    `Strategy: ${cycle.strategy ? cycle.strategy.status : "UNKNOWN"}`,
    `Content: ${cycle.content ? `${cycle.content.status}; execution=${cycle.content.executionState}` : "UNKNOWN"}`,
    `Publication: ${cycle.publication.count === 0 ? "NOT_RECORDED" : `${cycle.publication.count} record(s); latest=${cycle.publication.latestStatus}`}`,
    `Performance: ${cycle.performance.count === 0 ? "UNKNOWN; no real result" : `${cycle.performance.count} record(s); clicks=${perf.clicks ?? "UNKNOWN"}; conversions=${perf.conversions ?? "UNKNOWN"}`}`,
    `Revenue Candidate: ${cycle.revenueCandidate.count}`,
    `Evidence: ${cycle.evidence.count}`,
    `Actual Revenue: ${cycle.actualRevenue.count}`,
    `Improvement: ${cycle.improvement}`,
    `Next action: ${cycle.nextAction}`,
    "Truth contract: Unknown is not zero; AI output is NOT_EVIDENCE; Actual requires Evidence; Paid AI JPY 0; Paid fallback OFF; External Execution LOCKED.",
  ].join("\n");
}

export function buildAffiliateCycleReply(cycle, query = "") {
  const q = String(query);
  if (/投稿した|公開した/.test(q)) return `まだ投稿・公開記録はありません。Publicationは${cycle.publication.count}件です。次の行動は「${cycle.nextAction}」です。External ExecutionはLOCKEDのため、公開はOwnerが手動で行います。`;
  if (/成果/.test(q)) return cycle.performance.count === 0 ? "実成果はまだ記録されていません。PerformanceはUnknownで、Revenue Candidateは0件です。Unknownを0実績とは扱いません。" : `Performanceは${cycle.performance.count}件、Revenue Candidateは${cycle.revenueCandidate.count}件です。`;
  if (/売上|収益/.test(q)) return `Affiliate Actual Revenueは${cycle.actualRevenue.count}件、Evidenceは${cycle.evidence.count}件です。実EvidenceのないActualは作成していません。`;
  if (/次(?:に|何)/.test(q)) return `次の行動は「${cycle.nextAction}」です。現在のContentは${cycle.content?.executionState || "UNKNOWN"}、Publicationは${cycle.publication.latestStatus}です。`;
  return formatAffiliateCycleContext(cycle);
}
