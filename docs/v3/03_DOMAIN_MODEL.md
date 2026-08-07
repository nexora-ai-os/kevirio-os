# KEVIRIO V3 Domain Model

## Aggregate ownership

| Aggregate | Owns | References | Truth source | Primary lifecycle | Owner / AI responsibility |
|---|---|---|---|---|---|
| Organization | memberships, policies | Workspaces | identity/policy records | draft→active→suspended→archived | Owner governs; AI none |
| Workspace | tenant configuration | Organization | membership + policy | provisioning→active→suspended→archived | Owner authorizes; AI scoped |
| Business | DNA, objectives, engines | Workspace | approved business record | hypothesis→validated→operating→paused→closed | Owner creates/closes; AI operates |
| Revenue Engine | module configuration | Business | engine registry + contract | candidate→validated→active→retired | Owner activates; AI optimizes |
| Strategy | objectives, choices, assumptions | Business, Evidence | approved version | draft→review→approved→active→superseded | AI proposes; Owner approves |
| Operation | workflow instance | Engine, Strategy | operation record | planned→ready→running→blocked/completed/cancelled | AI coordinates; Owner resolves gates |
| Task | bounded work item | Operation, Employee | task/event history | queued→claimed→running→succeeded/failed/escalated | AI executes; Owner handles escalation |
| Approval | immutable request/decision | any target snapshot | protected approval record | pending→approved/rejected/expired→consumed | Owner decides; AI requests only |
| Content | artifact versions | Strategy, Asset | content repository | draft→review→approved→published/archived | AI drafts; Owner/policy approves |
| Publication | external occurrence/reference | Content, channel | verified channel evidence | planned→manual/eligible→published→verified | Human or gated executor acts |
| Evidence | source and verification | any claim/entity | evidence registry | candidate→verified/rejected→retained | AI collects; verifier/Owner confirms |
| Revenue/Cost | immutable monetary entries | Evidence, Business, Engine | canonical ledgers | pending evidence→verified→corrected | Finance validates; AI never fabricates |
| Experiment | hypothesis, design, measures | Strategy, Operations | experiment record | hypothesis→design→approval→execution→measurement→learning | AI designs; Owner approves execution |
| Learning | outcome conclusion | Evidence, Experiment | verified learning record | proposed→verified→deprecated | AI proposes; policy/Owner verifies |
| Business Memory | reusable pattern | Learning, Evidence | memory repository | candidate→active→stale/deprecated | AI retrieves; Owner resolves conflicts |
| Knowledge Graph | claims and typed edges | all aggregates | provenance-bearing graph | observed→verified→superseded | AI queries/proposes; gates promote |
| AI Employee | contract and assignment | Capabilities, Provider | employee registry | draft→approved→active→paused→retired | Owner hires/permissions; employee works |
| Asset | reusable version/license | Content, Strategy, Employee | asset library | draft→review→approved→deprecated→archived | AI creates; Owner controls exposure |
| Meeting | agenda, contributions, minutes | Employees, Decisions | meeting record | proposed→scheduled→held→closed | AI deliberates; cannot invent authority |
| Audit | material event envelope | all aggregates | append-only audit store | append only | System records; Owner reviews |

## Core relationships

Organization 1→N Workspace; Workspace 1→N Business; Business 1→N Revenue Engine; Engine 1→N Strategy/Operation; Operation 1→N Task; AI Employee N↔N Capability and Task; any governed target 1→N Approval snapshots; Content 1→N Publication; Publication/Provider sources 1→N Evidence; Evidence N↔N Revenue/Cost/Learning; Learning N→N Business Memory; every entity participates in typed Knowledge Graph edges and Audit events.

## Universal record envelope

Every durable domain object requires stable ID, Workspace ID, aggregate/version, lifecycle state, truth class, source/provenance, created/updated timestamps, actor, retention class and safe correlation metadata. Monetary records additionally require integer minor units, ISO currency and accounting period. AI-derived records require employee, prompt/version/hash, model/provider, confidence, cost and evidence references—never secret or raw credential content.

## State-machine rules

- Transitions are explicit, monotonic where integrity demands, and validated server-side.
- Completion requires state-specific evidence; partial workflow is not success.
- Rejection/cancellation is retained, not deleted.
- Corrections append or supersede; they do not rewrite verified history.
- Cross-aggregate commands validate Workspace equality and target versions atomically.
- AI may transition only states granted by contract; strategic, financial, legal-risk and external-impact gates escalate.

## Scalability model

Use Workspace/time composite indexes, archival tiers, immutable blob references, graph projections, CQRS read models and bounded fan-out. No aggregate transaction spans Workspaces. Cross-business portfolio analytics consumes asynchronous projections and always exposes freshness and truth classification.
