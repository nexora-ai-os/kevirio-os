# KEVIRIO V3 System Architecture

## Architectural style

V3 is a modular, event-informed Company OS with a relational canonical core, append-only Audit, evidence lineage, asynchronous workflows and read-optimized projections. It begins as a modular monolith and may extract services only at measured scale boundaries. APIs and events are versioned; UI never becomes a source of truth.

## Experience map

| Surface | Owner outcome | Canonical domains |
|---|---|---|
| Home / Command Center | Company health, exceptions and next decisions | Digital Twin, Decision Queue, Revenue, Risk |
| Revenue Engines | Portfolio and module operation | Business, Revenue Engine, Strategy, Operation |
| Affiliate Intelligence | Affiliate-specific intelligence | Program, Advertiser, Product, Offer, Campaign |
| Business Intelligence | Evidence-backed analysis | Evidence, Actual, Forecast, Insight |
| Marketing / SEO / Content / Social | Governed demand and publishing work | Strategy, Content, Publication, Experiment |
| AI Employees | Workforce state and contracts | Employee, Capability, Task, Meeting |
| Approvals / Operations | Decisions and bounded work | Approval, Decision, Operation, Task |
| Revenue / Insights / Learning | Outcomes and improvement | Ledgers, Insight, Learning, Memory |
| Business Memory / Knowledge | Durable reusable intelligence | Memory, Knowledge Graph, Assets |
| Marketplace | Internal-first asset exchange | Asset, license, approval; public commerce Locked |
| Audit / Settings | Trust and policy | Audit, identity, membership, provider, budgets |

## Logical layers

1. **Experience:** Japanese-first web; future mobile/desktop clients consume the same contracts.
2. **Application:** command/query orchestration, idempotency, decision and approval workflows.
3. **Domain:** constitution-governed modules and state machines with no transport dependency.
4. **Data:** Workspace-scoped canonical records, temporal versions, ledgers and projections.
5. **AI workforce:** registry, planner, bounded task runtime, meeting coordinator, evaluator.
6. **Integration:** server-only Provider Gateway, adapters, outbox, Cost Guard and circuit breakers.
7. **Trust:** authentication, authorization, RLS, protected commands, encryption, Audit and observability.

## Control plane and work plane

The control plane owns Business DNA, policies, employee contracts, capabilities, permissions, budgets, strategy versions and approvals. The work plane executes bounded tasks and produces artifacts, evidence candidates and events. Work-plane output cannot mutate control-plane authority or Actual ledgers without protected gates.

## Canonical flow

Signal → Insight/Opportunity → Strategy proposal → Owner Decision → Operation/Experiment → Task → approved External Execution or Manual Execution → Publication/Evidence → Actual Revenue/Cost → Profit/ROI → Learning → Business Memory → next Decision. Every transition emits Audit metadata and retains truth class.

## Scale and resilience

- Workspace is the partition key; Organization is a grouping, never a bypass.
- Cursor pagination, bounded queries, read models and async jobs support millions of records.
- Event contracts carry Workspace, actor, causation, correlation, schema version and idempotency key.
- Transactional outbox prevents data/event splits; consumers are idempotent and replay-safe.
- Multi-region reads use immutable/versioned data; authoritative writes retain a declared home region.
- Offline clients cache encrypted read models and queue unsigned intents; server revalidates all intents.
- Retention, legal hold, export and deletion are policy-driven; Audit integrity survives projection rebuilds.
- Availability degrades to read-only/Unknown/Locked rather than unsafe execution.

## Security architecture

Identity → verified principal → Workspace membership → role/policy → resource/action condition. RLS and protected command checks are mandatory defense in depth. Secrets remain server-side, encrypted and redacted. Provider operations require connection health, allowed model/action, Cost Guard reservation, current Approval where applicable and an idempotent execution record.

## Future SaaS, teams and organizations

Entitlements and billing never grant domain Permission directly. Team roles are additive policies under Owner authority. Organization administrators may manage membership but cannot silently read or operate all Workspaces. Public API clients use scoped service principals, versioned contracts and the same evidence/audit boundaries.
