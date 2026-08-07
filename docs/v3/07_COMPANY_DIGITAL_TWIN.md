# KEVIRIO V3 Company Digital Twin

## Definition

The Company Digital Twin is a time-aware, evidence-backed projection of each Business and its portfolio. It is not a second source of truth: it derives from canonical domains and exposes freshness, provenance and truth classification.

## Twin dimensions

| Dimension | Measures | Required evidence | Degraded state |
|---|---|---|---|
| Business Health | objective progress, concentration, resilience | strategy and operational outcomes | Unknown with missing coverage |
| Profitability | Actual Revenue, Actual Cost, profit, margin, ROI | verified ledgers | separated by currency/period |
| Cash Flow | inflow/outflow timing, runway | payment/cost evidence | forecast explicitly separated |
| AI Employee Status | load, success, cost, failure, escalation | task/execution records | unavailable employee shown Locked |
| Business Risk | compliance, financial, operational, concentration | findings and rationale | Unknown is not PASS |
| Opportunity | impact, difficulty, confidence, rationale | source-linked inference | remains Inference |
| Pipeline | stage, value class, aging | operation/sales records | stale stage flagged |
| Decision Queue | urgency, impact, reversibility, evidence | pending approvals/decisions | no fabricated priority |
| Learning Progress | experiment closure and reuse | verified learning | incomplete stays candidate |
| Knowledge Growth | verified claims, conflicts, freshness | provenance graph | conflicts visible |
| Operational Health | throughput, SLA, failure and backlog | task/event history | partial telemetry disclosed |

## Projection rules

Each metric declares formula version, source set, as-of time, completeness, truth class and drill-through evidence. Snapshots are immutable and reproducible. Corrections create a newer projection; they never rewrite source events. Portfolio rollups do not mix Workspace access, currency or incompatible periods.

## Decision loop

Twin signal → explainable diagnosis → alternative strategies → impact/risk forecast → Owner Decision → governed execution → measured Evidence → updated Twin. AI may recommend; the Owner owns strategic trade-offs and risk acceptance.

## Scale

Incremental projections, time partitions, materialized read models and event-driven recomputation avoid scanning canonical history. Hot operational views and cold historical evidence use separate retention tiers while retaining stable references.
