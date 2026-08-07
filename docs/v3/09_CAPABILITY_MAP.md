# KEVIRIO V3 Capability Map

## Capability hierarchy

| Level 1 | Level 2 capabilities | Primary authority | Core measures |
|---|---|---|---|
| Govern Company | identity, DNA, portfolio, policy, decisions | Owner | objective/profit/risk alignment |
| Operate Businesses | engines, strategies, operations, experiments | Business + Owner gates | cycle time, contribution profit |
| Create Demand | research, marketing, SEO, content, social, sales | Strategy | qualified demand and conversion |
| Fulfill Value | delivery, publication, support, entitlement | Operation | quality, SLA, retention |
| Manage Money | recognition, costs, cash, forecasts, ROI | Finance truth | profit, cash, evidence coverage |
| Run AI Workforce | registry, assignment, meetings, evaluation, learning | Employee contracts | reliability, cost, escalation |
| Decide and Approve | queue, snapshots, alternatives, approval, consumption | Owner | decision latency and outcome |
| Learn and Reuse | insight, learning, memory, knowledge, assets | Evidence gates | reuse and confidence calibration |
| Integrate Safely | providers, OAuth, gateway, execution, cost guard | Platform policy | health, cost, failure rate |
| Assure Trust | auth, isolation, permission, audit, compliance, recovery | Platform + Owner | control coverage and incidents |

## Capability contract

Every capability has: stable identifier/version, mission, owning domain, typed input/output, truth effect, eligible actors, required Permission, approval/evidence/cost gates, idempotency, failure states, Audit events, service level and deprecation path. `read`, `propose`, `approve`, `mutate-internal` and `execute-external` are separate action classes.

## Maturity

`Idea → Research → Design → Prototype → Conditional → Production`, independently recording Source Validated, Build Validated, Browser Validated and Owner Approved. Locked, Deprecated and Archived are explicit. Environment and feature maturity remain separate axes.

## Build/buy/provider decisions

Business capability remains vendor-neutral. Providers implement adapters and can be replaced without changing employee identity or domain truth. Buy when commodity and bounded; build when it encodes Business DNA, truth, evidence, authority or competitive learning.
