# KEVIRIO V3 Constitution

Status: **DRAFT — OWNER APPROVAL REQUIRED**. This blueprint is authoritative for V3 implementation only after explicit Owner approval; it does not mark existing ADRs `ACCEPTED`.

## Mission and authority

KEVIRIO is an AI Company Operating System: AI Employees operate profitable businesses inside explicit authority while the Owner makes strategic decisions. The Owner alone may approve constitutional change, business creation/closure, material strategy, risk acceptance, budgets, external execution enablement, and release. Capability never implies Permission; Approval never by itself enables External Execution.

## Immutable invariants

1. Every business record belongs to exactly one Workspace; Organization access is derived, never inferred.
2. Actual requires verified Evidence. Forecast, Inference, Unknown, Mock and Test never become Actual by presentation.
3. Unknown is not zero, absent, failed, or unregistered.
4. Approval binds an immutable version/hash, expires, is one-use where execution is concerned, and is audited.
5. External Execution is fail-closed, separately gated, budgeted, idempotent and revocable.
6. Browser clients never hold server secrets or directly perform privileged mutation.
7. Canonical mutation crosses Repository and protected command/RPC boundaries with authorization, validation, transaction and Audit.
8. Audit is append-only; Business Memory cites Evidence; learning never rewrites history.
9. Provider, model, AI Employee, Capability, Permission and OAuth Scope are distinct.
10. Profit and ROI are computed only within compatible currency, period and truth class.

## Canonical concepts

Each row fixes purpose/scope, ownership, lifecycle, dependencies, constraints, failure mode and scale posture.

| Concept | Purpose and scope | Ownership and lifecycle | Dependencies and constraints | Failure mode and future scale |
|---|---|---|---|---|
| Owner | Final strategic authority; not routine operator | Human principal; verified → active/suspended | Identity, Workspace membership; AI cannot override | Fail closed; delegated roles may be added without diluting final authority |
| Workspace | Hard data/permission isolation boundary | Owner/Organization; active → suspended → archived | Membership, RLS, protected commands | Missing/mismatch denies access; shard/region key |
| Organization | Future legal/team grouping of Workspaces | Owner-governed; draft → active → archived | Explicit memberships and policies | No implicit cross-Workspace visibility; enterprise hierarchy |
| Business | Profit-seeking operating unit | Workspace; hypothesis → operating → paused/closed | Business DNA, Revenue Engines, ledgers | Unknown health remains Unknown; independently partitionable |
| Revenue Engine | Extensible commercial mechanism | Business; candidate → validated → active → retired | Module contract, Evidence, costs | Unsupported module is Locked; plug-in evolution |
| Evidence | Verifiable support for a claim | Workspace; candidate → verified/rejected → retained | Source, actor, timestamp, integrity | Missing evidence blocks Actual; immutable object storage scale |
| Truth Classification | Meaning of every claim/value | Producer assigns; verifier may promote by rule | Actual/Forecast/Inference/Unknown/Mock/Test | Missing classification becomes Unknown; universal metadata |
| Actual | Verified historical fact | Canonical ledger/source; immutable correction chain | Verified Evidence and integrity gates | Never inferred; append/correction at scale |
| Forecast | Prospective modeled value | Strategy/finance owner; versioned/superseded | Assumptions, horizon, model/version | Expired or missing assumptions becomes Unknown |
| Inference | AI-derived interpretation | AI execution; proposed → reviewed/superseded | Prompt/model/version, sources, confidence | Never presented as fact; reproducible lineage |
| Unknown | Evidence insufficient to determine state | Any domain; resolves only through evidence | Explicit reason and next verification action | No coercion to zero; queryable quality backlog |
| Approval | Protected Owner decision process | Owner; pending → approved/rejected/expired/consumed | Immutable target snapshot/hash, scope, expiry | Mismatch/replay fails closed; scalable queues |
| Learning | Evidence-backed conclusion from outcomes | Business/Workspace; proposed → verified → deprecated | Evidence, experiment, decision | Unsupported learning stays Inference |
| Audit | Integrity history of material events | Platform; append-only | Actor, source, timestamp, safe metadata | Audit failure blocks protected mutation; partitioned retention |
| Security | Confidentiality, integrity, availability controls | Platform and Owner | Least privilege, encryption, redaction, recovery | Ambiguity fails closed; zero-trust services |
| Workspace Isolation | Enforcement of tenant separation | Platform | RLS, composite identity, service checks | Cross-boundary request rejected and audited |
| Permission | Explicit authorization to act | Owner/policy; granted → revoked/expired | Principal, resource, action, conditions | Absent permission denies; policy engine scale |
| External Execution | Real change outside KEVIRIO | Owner-governed; Locked → eligible → approved → executed | Permission, approval, provider health, Cost Guard, idempotency | Any gate failure blocks; queue/outbox scale |
| Business Memory | Reusable verified organizational learning | Workspace/Business | Learning, Evidence, provenance, confidence | Stale/conflicting memory is flagged, never silently replaced |
| Knowledge | Queryable assertions and relationships | Workspace; observed → verified → superseded | Provenance, truth class, temporal validity | Conflict preserved as competing claims |
| Profit | Actual Revenue minus Actual Cost by currency/period | Finance ledger | Verified revenue/cost | Mixed truth/currency returns Unknown |
| ROI | Profit relative to evidenced investment | Finance/Strategy | Compatible numerator/denominator and window | Missing denominator returns Unknown |
| AI Employee | Governed worker contract, not Provider/model | Workspace registry; draft → approved → active/paused/retired | Mission, capabilities, permissions, cost, evidence | Contract/gate failure pauses and escalates |
| Capability | Technically supported bounded action | Platform/employee contract | Input/output schemas and provider adapter | Unavailable capability cannot imply permission |
| Meeting | Bounded deliberation producing proposals | Convening employee; scheduled → held → closed | Agenda, participants, evidence, max rounds | No decision without Owner/authorized policy |
| Decision | Recorded selection with rationale | Owner or explicitly delegated policy | Alternatives, evidence, impact, reversibility | Ambiguous authority blocks enactment |
| Asset | Versioned reusable internal artifact | Workspace/Business | Provenance, license, approval, status | Public sale/export separately gated |
| Strategy | Versioned choice of objectives and resource allocation | Business; draft → approved → active → superseded | Business DNA, Evidence, Forecast, Owner decision | AI proposes; Owner owns material strategy |
| Operation | Bounded unit of domain work | Business/Revenue Engine | Workflow, tasks, approvals, evidence | Partial work never reported complete |
| Publication | Evidence of content made externally available | Business | Approved content, channel, timestamp, source reference | Draft is not publication; automation separately gated |
| Content | Versioned communicative artifact | Business | Strategy, audience, compliance, approval | AI output begins as draft/inference |
| Experiment | Controlled test of a hypothesis | Business | Design, approval, manual/external gate, measurement | No automatic execution by default |
| Provider | External capability vendor/platform | Platform connection scoped to Workspace | Server-only credentials, health, quotas, adapter | Unhealthy/unpriced provider is Locked |

## Change control

Amendment requires explicit Owner approval, affected-document review, security/data/revenue impact, evidence, migration and rollback plan. Implementation evidence cannot amend this Constitution. Existing applied migrations are never edited in place.
