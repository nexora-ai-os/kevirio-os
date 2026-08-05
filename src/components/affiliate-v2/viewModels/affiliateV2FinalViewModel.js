export const UNKNOWN = "Unknown";

const value = (input) => input === null || input === undefined || input === "" ? UNKNOWN : input;
const percent = (input) => input === null || input === undefined ? UNKNOWN : `${Math.round(Number(input) * (Number(input) <= 1 ? 100 : 1))}%`;

export function opportunityViewModel(snapshots = []) {
  const record = snapshots.find((item) => item.snapshotType === "opportunity_score");
  const payload = record?.payload || record?.data || {};
  return { score: value(payload.score ?? record?.score), expectedImpact: value(payload.expectedImpact ?? payload.expected_impact), difficulty: value(payload.difficulty), confidence: percent(payload.confidence ?? record?.confidence), why: value(payload.why ?? payload.rationale), ownerAction: value(payload.requiredOwnerAction ?? payload.required_owner_action), truthClass: value(record?.truthClass), evidence: value(record?.evidenceReference ?? payload.evidence) };
}

export const TIMELINE_STAGES = ["Offer", "Research", "Strategy", "Content", "Approval", "Manual Publication", "Evidence", "Revenue", "Learning", "Decision", "Audit"];
export function timelineViewModel(events = []) { return TIMELINE_STAGES.map((stage) => { const event = events.find((item) => String(item.stage ?? item.eventType ?? item.type).toLowerCase() === stage.toLowerCase()); return { stage, timestamp: value(event?.timestamp ?? event?.createdAt), source: value(event?.source), actor: value(event?.actor), evidence: value(event?.evidence), truthClass: value(event?.truthClass) }; }); }

export const MEMORY_CATEGORIES = ["Successful Patterns", "Failed Patterns", "Audience Learnings", "Revenue Learnings", "Compliance Learnings", "Reusable Knowledge", "Owner Decision Patterns"];
export function memoryViewModel(memories = []) { return MEMORY_CATEGORIES.map((category) => ({ category, items: memories.filter((item) => String(item.category).toLowerCase() === category.toLowerCase()).map((item) => ({ id: item.id, summary: value(item.summary), evidence: value(item.evidence), confidence: percent(item.confidence), reuseCount: value(item.reuseCount ?? item.reuse_count), relatedPrograms: value(Array.isArray(item.relatedPrograms) ? item.relatedPrograms.join(", ") : item.relatedPrograms), lastUsed: value(item.lastUsed ?? item.last_used) })) })); }
export function experimentViewModel(experiments = []) { return experiments.map((item) => ({ id: item.id, hypothesis: value(item.hypothesis), status: value(item.status), evidence: value(item.evidence), truthClass: value(item.truthClass) })); }
export function promptViewModel(prompts = []) { return prompts.map((item) => ({ id: item.id, prompt: value(item.name ?? item.promptId ?? item.prompt_id), version: value(item.version), purpose: value(item.purpose), hash: value(item.hash), model: value(item.model), temperature: value(item.temperature), schema: value(item.schemaName ?? item.schema_name), latency: value(item.latency), cost: value(item.cost), diff: value(item.diff) })); }
