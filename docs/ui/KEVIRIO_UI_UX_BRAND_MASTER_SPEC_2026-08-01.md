# KEVIRIO UI / UX / Brand Master Specification

| Metadata | Value |
|---|---|
| Version | 2026-08-01 |
| Status | IMPLEMENTATION-READY SPECIFICATION — OWNER REVIEW REQUIRED |
| Scope | UI / UX / Brand Identity / Logo / Motion / Information Architecture |
| Owner language | Japanese |
| Product | KEVIRIO — AI Company Operating System |
| Evidence baseline | Repository at `4837c813c75794837ef10d83c564afdee87f3761` plus current Owner-owned working tree |
| Production behavior authority | Repository, protected RPC, migrations and approved Owner decisions |
| Browser validation | BLOCKED / NOT VERIFIED |

## RESULT

**CONDITIONAL GO**

Design direction and an incremental UI-only implementation are viable. Current Production UI is **NO-GO for “Completed / Final / Approved / Freeze”** because browser validation is unavailable and critical source-level brand/copy/data-truth gaps remain.

Conditions before UI completion:

1. Correct all source mojibake from an approved Japanese copy source.
2. Reconcile the Gold K application mark and the mint/blue favicon.
3. Preserve current routes, repositories, Approval, Evidence, Actual Revenue, Provider, Cost Guard and Workspace boundaries.
4. Keep Migration 012-dependent AI Employee behavior Conditional/Locked.
5. Complete authenticated browser, responsive, accessibility, motion and performance validation.
6. Obtain explicit Owner approval.

## EXECUTIVE SUMMARY

The repository already contains a credible Production Shell, route-level lazy loading, a broad shared Design System, semantic state registry, repository-backed Home/Approval/Operations/Revenue screens and guarded Provider/AI Employee presentations. The fundamental architectural direction should be retained.

The current UI does not yet express the full operating model requested by the Owner. Home shows decision and repository health but does not establish a complete Profit First Owner Control Plane. Revenue engines, JP/Global comparison, AI workforce responsibility/throughput, channel performance, cost composition and bottlenecks are not available as one coherent operating hierarchy. Several requested domains have only legacy components or no active canonical route.

The most urgent defect is not styling: many active Japanese labels are mojibake in source. This fails Japanese-First, accessibility, comprehension and Owner trust. The second critical brand defect is identity inconsistency: the application uses a metallic Gold K while `public/kevirio-favicon.svg` uses a mint/blue abstract loop. Only one favicon asset exists; SNS/YouTube/logo lockup assets are Not Implemented.

The completion strategy is not a rewrite. Keep the shell, routing, repositories, semantic states and reusable Design System; repair copy and brand identity first; then restructure information from the complete target backwards. Do not expose screens whose backend/domain truth is absent.

## CURRENT UI AUDIT

### Navigation

Current canonical navigation has seven primary destinations and three utility destinations:

- Primary: Home, AI Employees, Approvals, Operations, Revenue, Insights, Integrations.
- Utility: Inbox, Audit, Settings.
- Labs is correctly excluded.
- Existing deep-link routes and legacy redirects are implemented.

Findings:

- **KEEP:** canonical route registry, BrowserRouter, history/deep links, lazy routes and Labs isolation.
- **MODIFY:** Japanese labels and grouping. Current source contains mojibake.
- **EXTEND only after domain readiness:** Offer, Campaign and Revenue sub-navigation may expose existing routes; do not add Market Intelligence, Content Factory, Media Calendar or Business Memory to Production navigation until a canonical source and route exist.
- **REMOVE from presentation graph:** unreachable legacy navigation concepts and duplicate legacy component systems, only after import/reachability evidence confirms safe removal.

### Screen audit

| Screen | Current evidence | Classification | Required direction |
|---|---|---|---|
| Home | Repository-backed revenue/operations overview, next action, KPI, foundation panel | MODIFY | Reorder as Owner Control Plane; Net Profit and next decision above operational detail |
| AI Employees | Google Operations contract/capability view, Dry Run, API calls 0 | MODIFY | Present organization/responsibility/maturity; never imply active workforce completion |
| Approvals | Repository-backed immutable snapshot decision flow | KEEP + MODIFY | Preserve actions; improve decision hierarchy, impact, expiry and reason comprehension |
| Operations | Offer Operations repository and protected commands | KEEP + MODIFY | Show lifecycle, bottleneck, next gate, evidence/cost relationship |
| Revenue | Canonical repository, Actual/Forecast/Evidence/Campaign route family | KEEP + MODIFY | Make Profit First and truth classification dominant |
| Insights | Canonical verified-revenue analytics | MODIFY | Profit/channel/market comparison only where source exists |
| Integrations | Read-only Provider Hub, guarded state | KEEP + MODIFY | Separate connected, authorized, healthy, and executable states |
| Inbox | Canonical truthful locked/non-production boundary | KEEP | Do not invent queue/backend |
| Audit | Workspace-scoped limited read projection and redaction | KEEP + EXTEND | Improve filters only after backend requirement is approved |
| Settings | Read-only policy display; mutations Not Implemented | KEEP | Do not display fake controls |
| Owner Login | Desktop/mobile screenshot files exist | UNKNOWN visually in this pass | Browser/image ACL prevented current visual confirmation |
| Labs | Fixture-only guarded component preview | KEEP | No Production navigation or data |

### Brand

**KEEP**

- White-led light UI.
- Champagne/metallic Gold K application symbol.
- Warm neutral surfaces.
- Silver structural borders.
- Pale Blue/Purple only as semantic or AI context.
- Existing premium spacing, radius and shadow direction.

**MODIFY**

- Replace mint/blue favicon identity with an approved compact Gold K derivative.
- Reduce generic gradient/glow usage where it lacks information.
- Ensure Gold signifies brand/priority/Owner decision, not warning/success.
- Consolidate duplicate legacy “glass” components into the canonical Design System when migrated.

**NOT IMPLEMENTED**

- Horizontal logo lockup.
- Documented wordmark asset.
- Monochrome asset.
- Compact approved icon asset.
- SNS avatar asset.
- YouTube channel/avatar/banner asset.
- Minimum-size and clear-space production asset sheet.
- Incorrect-usage asset sheet.

### Information Architecture

Current screens provide individual domain views but not a complete, single Owner mental model. Home partially supports current state and next action. Profit composition, JP/Global, revenue-engine activity, workforce throughput, provider/account health and bottleneck summary are incomplete or unavailable.

Required hierarchy:

1. Company State
2. Next Owner Action
3. Critical Profit KPI
4. Active operating status
5. Exceptions and bottlenecks
6. Detailed domain information
7. History
8. Configuration

### Profit First

Confirmed strengths:

- Money semantics fail closed.
- Verified Actual is distinct from Forecast/Mock.
- Profit calculation uses verified revenue and actual operating cost per currency.
- Unknown can remain unknown.

Missing or incomplete UI:

- Net Profit is not consistently the primary KPI.
- Full cost composition is not presented across the Owner Control Plane.
- ROI/ROAS, Owner workload and channel economics have no universally verified canonical source.
- Cross-currency aggregation must remain prohibited without an approved conversion source.

### AI Employees

The active canonical Employee screen represents Google Operations only. It includes contract/capability and Dry Run boundary, but not a complete workforce organization view.

Required display for every employee:

- Role and responsibility
- Capability and permission separately
- Current verified task/workflow
- Input/output classification
- Approval requirement
- Cost and quota state
- Failure/retry state
- Metrics and latency only when sourced
- Handoff
- Maturity
- Last activity
- Owner action required

Never show fictional “working” activity. Migration 012-dependent runtime remains Conditional/Locked.

### JP / Global

No complete canonical JP/Global operating comparison was found in active Production UI. A locale translation is not a market operating model.

A future comparison requires canonical data for market, language, currency, channel, offer, performance, cost and evidence classification. Until that exists, show **Not Implemented** or omit the control; do not populate mock values.

### State Truth

The semantic registry covers Mock, Forecast, Candidate, Pending, Approved, Running, Partial, Completed, Evidence Waiting, Actual, Failed, Locked, Unknown, Empty, Unconnected, Verified and other states.

Problems:

- Several Japanese labels in the registry are mojibake.
- “connected”, “permission granted”, “healthy” and “external execution allowed” must remain separate.
- Migration 012 presence must never be shown as remote readiness.

### Responsive, Accessibility, Performance and Motion

Source evidence supports responsive shell breakpoints, drawer navigation, 44px targets, focus handling, semantic landmarks, reduced motion and route lazy loading. Automated tests pass. Browser confirmation remains BLOCKED.

Current build baseline:

- Initial JS: 448.84 kB raw / 130.60 kB gzip
- JavaScript chunks: 17
- Initial CSS: 43.07 kB raw / 8.98 kB gzip
- Largest JS chunk: 448.84 kB
- Chunks over 500 kB: 0

## KEEP / EXTEND / MODIFY / MERGE / REPLACE / REMOVE

| Target | Decision | Rationale |
|---|---|---|
| BrowserRouter and canonical routes | KEEP | History, deep links and lazy route mapping exist |
| Production Shell | KEEP + MODIFY | Strong responsive/accessibility base; copy and IA refinement needed |
| Design tokens | KEEP + EXTEND | Correct palette foundation; add role-specific tokens without replacing values blindly |
| Semantic state registry | KEEP + MODIFY | Strong truth model; Japanese labels require canonical repair |
| Shared Design System | KEEP + EXTEND | Broad primitives exist; target IA needs profit/workforce/context patterns |
| Repository-backed screens | KEEP | Canonical business boundary |
| Duplicate legacy UI components | MERGE then REMOVE candidate | Avoid two Button/Card/State systems after migration |
| Legacy mock/data graph | REMOVE from Production graph | Must remain unreachable or explicitly fixture-only |
| Gold K BrandMark | KEEP + REFINE | Matches approved identity direction |
| Mint/blue favicon | REPLACE | Conflicts with Gold K identity |
| Decorative MotionBackground | REMOVE candidate from Production | Motion needs operational meaning |
| English-first headings | MODIFY | Japanese primary, English secondary |
| Fake/Coming Soon controls | REMOVE | Violates state truth |
| New domain screens without backend | UNKNOWN / BLOCKED | Backend Requirement first |

## BRAND SYSTEM

### Brand principles

- Executive clarity over visual spectacle.
- Japanese precision and long-term trust.
- White space communicates control, not emptiness.
- Gold communicates KEVIRIO identity and Owner significance.
- Silver/neutral gray creates structure.
- Pale Blue conveys information/forecast only.
- Pale Purple conveys AI/context only.
- Semantic success/warning/danger colors retain their own meanings.

### Logo system

| Asset | Specification | Current state |
|---|---|---|
| Primary Logo | Gold K + KEVIRIO wordmark + optional “AI COMPANY OPERATING SYSTEM” descriptor | Not Implemented as reusable asset |
| Horizontal Logo | Symbol left, wordmark right; light background default | Not Implemented |
| Symbol Mark | Existing geometric Gold K, simplified for small sizes | Implemented in React only |
| Wordmark | KEVIRIO uppercase with controlled tracking | CSS/text only |
| Monochrome | Single ink or white version without metallic gradient | Not Implemented |
| Gold Version | Champagne-to-deep-gold metal treatment | Implemented in React mark |
| Compact Icon | Gold K centered on warm-white square | Not Implemented |
| Favicon | Compact Gold K; no mint/aqua/abstract loop | Current asset must be replaced |
| SNS/YouTube | Compact mark with clear space; no tiny descriptor | Not Implemented |

Rules:

- Clear space: at least one K-stem width around the mark.
- Minimum digital symbol: 20px; below this use simplified single-color form.
- Do not add crown, circuit, hexagon, shield or unrelated gradient ornament.
- Do not distort, rotate, recolor to mint/aqua, apply heavy glow or place on low-contrast gold.
- Dark-background variation is limited-use only and requires a white/monochrome mark.

### Color roles

| Role | Existing token direction | Use |
|---|---|---|
| Canvas | Pearl/warm white | Main background |
| Surface | White | Cards and controls |
| Brand | Champagne Gold 300/500/700 | Identity, selected navigation, Owner decision |
| Structure | Silver/Platinum | Borders, dividers, disabled structure |
| Information | Pale Blue | Forecast/information |
| AI context | Pale Purple | AI classification only |
| Success | Green | Verified/success, not brand |
| Warning | Amber | Risk/attention, not decorative gold |
| Danger | Red | Failure/destructive |
| Text | Ink/neutral gray | Primary hierarchy |

### Typography

- Japanese primary: system Japanese stack already defined.
- English technical labels: secondary and short.
- H1: 32–48px responsive, one per route.
- Section heading: 20–26px.
- Body: minimum 16px for principal copy.
- Supporting labels: 12–14px only where non-critical.
- Monetary figures use tabular numerals.
- Never reduce important copy to create a “premium” appearance.

### Icon and imagery

- Use Lucide for operational controls and states.
- Gold K is the only identity mark.
- Avoid arbitrary emoji, 3D objects, stock AI brains and decorative robots.
- Charts require accessible labels and cannot replace exact values.
- Empty states use restrained iconography, not illustration-first spectacle.

## INFORMATION ARCHITECTURE

### Owner Control Plane

Above the fold:

1. Company status: healthy / attention / blocked with sourced reason.
2. Next Owner Action: one primary decision with impact, deadline and destination.
3. Net Profit by currency; if unavailable, explicit Unknown/No Verified Actual.
4. Gross Verified Actual, actual cost and margin as separate values.
5. Critical risk/Cost Guard state.

Below:

- Active revenue engines/offers where canonical.
- Pending approvals.
- Operations bottlenecks.
- AI Employee maturity and current verified work.
- Provider/account health.
- Recent learning/audit events.

### Target domain model

- Owner Control Plane
- Revenue and Profit
- Offers and Campaigns
- Operations and Workflows
- Approval
- AI Employees
- Provider Hub
- Insights
- Risk/Audit
- Inbox
- Settings

Market Intelligence, Content Factory, Media Calendar, Business Memory and multi-engine comparison remain target domains, not Production screens, until canonical backend/domain evidence exists.

## NAVIGATION / SCREEN MAP

| Target IA | Existing route | Current implementation | Decision |
|---|---|---|---|
| Owner Control Plane | `/home` | CanonicalHome | MODIFY |
| AI Employees | `/employees` and detail routes | Google Operations screen | MODIFY; Conditional |
| Approvals | `/approvals` and detail | CanonicalApprovals | KEEP + MODIFY |
| Operations | `/operations`, offers/workflows/detail | OfferOperationsWorkspace | KEEP + MODIFY |
| Revenue / Profit | `/revenue` family | ProductionRevenueWorkspace | KEEP + MODIFY |
| Insights | `/insights` | Analytics | MODIFY |
| Provider Hub | `/integrations` and detail | ProviderHub | KEEP + MODIFY |
| Inbox | `/inbox` | truthful boundary | KEEP |
| Risk/Audit | `/audit` | CanonicalAudit | KEEP + EXTEND |
| Settings | `/settings` | read-only policy | KEEP |
| Campaigns | `/revenue/campaigns` | shared Revenue screen | EXTEND within existing route |
| Offers | `/operations/offers` | shared Operations screen | EXTEND within existing route |
| Market Intelligence | None active | legacy source exists | New Screen Candidate; Backend Requirement |
| Content Factory | None active | legacy source exists | New Screen Candidate; Backend Requirement |
| Media Calendar | None | None canonical | New Screen Candidate; Backend Requirement |
| Business Memory | None active | legacy source exists | New Screen Candidate; Backend Requirement |

Desktop navigation should group Control, Growth and System without exceeding current cognitive load. Mobile uses drawer plus contextual in-page tabs; it must not add a second competing bottom navigation until tested.

## DESIGN SYSTEM

### Token extensions

Preserve current tokens. Add only semantic aliases required by the target:

- `--surface-company-state`
- `--surface-owner-action`
- `--surface-profit`
- `--color-state-conditional`
- `--color-state-evidence-pending`
- `--color-state-unconnected`
- `--motion-enter`, `--motion-state`, `--motion-attention`
- `--density-comfortable`, `--density-compact`
- `--number-tabular`

Do not introduce Tailwind or another UI library.

### Component system

Keep existing components and add only when required:

- `CompanyStateHero`: sourced company state and reason.
- `ProfitSummary`: currency-separated Actual/Cost/Net/Margin.
- `OwnerDecisionPanel`: one decision, evidence, impact, expiry and action.
- `RevenueEngineSummary`: only for canonical engine data.
- `WorkforceSummary`: maturity, verified task, cost, failure, owner action.
- `BottleneckList`: operation/workflow gates.
- `MarketScopeBadge`: JP/Global/market only with canonical source.
- `DataProvenance`: freshness, source and truth class.
- `CostComposition`: actual categories only.
- `ResponsiveDetailDrawer`: table details without page overflow.

Existing Button, Badge, Card, Money, Table, Modal, Timeline, PageHeader, State components remain canonical. Legacy shared Button/Card/GlassPanel should not be extended.

### State system

Every state includes label + icon + tone; color alone is insufficient. Unknown has no numeric fallback. Conditional cannot use Production badges. Connection, permission, health and execution authorization appear as separate rows.

### Layout

- Desktop ≥1440: 12-column content grid, sticky shell, max 1760px.
- Laptop 1025–1439: 8-column grid; cards reflow, no reduced essential content.
- Tablet 601–1024: drawer navigation, 4-column grid, tables convert to summary/detail.
- Mobile ≤600: single column, Owner Action first, 44px targets, no page horizontal scroll.
- Reading content stays ≤760px; operational tables can use wide container.

## MOTION SYSTEM

| Token | Duration | Easing | Use |
|---|---:|---|---|
| Fast | 140ms | existing `--kv-ease` | hover/focus/control feedback |
| Base | 220ms | existing `--kv-ease` | drawer, disclosure, state change |
| Slow | max 650ms | existing `--kv-ease` | rare first-load emphasis only |

- Page transition: opacity 0→1 and 4–8px movement, ≤220ms; content remains available.
- Status change: badge/icon crossfade; never animate a false intermediate state.
- Owner attention: one-time border/background emphasis, no pulsing.
- Loading: skeleton only when real loading exists; no artificial delay.
- Success/error: immediate text/icon feedback.
- Reduced motion: remove transforms and animation; retain state text.
- No parallax, 3D, floating decoration, continuous KPI movement or concurrent glow field.
- No animation may block input, cause layout shift or trigger external execution.

## DOMAIN MAPPING

| UI display | Source of truth | Truth rule |
|---|---|---|
| Verified Actual | Revenue repository / verified revenue records | Evidence-verified only |
| Forecast | Canonical forecast projection | Always labelled Forecast |
| Net Profit | Verified revenue minus actual cost, per currency | No unverified/cross-currency aggregation |
| Approval | Approval request/decision RPC state | Immutable snapshot; no bulk approval |
| Operation | Offer Operations repository | Display canonical lifecycle only |
| AI Employee | Registry/local contract; Migration 012-dependent runtime | Conditional/Locked until remote and architecture gates pass |
| Provider connection | Provider connection projection | Separate connection, scope, health, cost and execution |
| Cost Guard | Policy/reservation/ledger/breaker | Unknown/unavailable fails closed |
| Audit | Workspace-scoped audit projection | Redacted; no credential values |
| Owner Action | Derived from canonical blockers/approvals | Must link to source reason and destination |
| JP/Global | No complete source found | Not Implemented; do not mock |

## BACKEND REQUIREMENTS

These are not authorized implementations:

| Requirement | Reason | Affected screen | Priority | Production impact | Architecture impact |
|---|---|---|---|---|---|
| Canonical company-health projection | One sourced overall state | Home | High | Owner cannot trust a synthetic health score | New read projection/repository contract |
| Profit/cost composition projection | Profit First hierarchy | Home/Revenue/Insights | High | Incomplete economics | Preserve currency/evidence semantics |
| Revenue-engine registry and lifecycle | Show active engines truthfully | Home/Revenue | Medium | Cannot show requested engine view | New domain design likely required |
| Market dimension model | JP/Global comparison | Revenue/Insights | Medium | Comparison unavailable | Schema/repository decision |
| Canonical workforce summary | Multi-employee operations | Home/Employees | High after Migration 012 | AI activity cannot be claimed | Depends on 012 remediation/runtime |
| Workflow bottleneck projection | Owner exception handling | Home/Operations | Medium | Manual discovery remains | Repository projection |
| Provider account-health summary | One health view | Home/Integrations | Medium | Fragmented readiness | Provider projection only |
| Audit search/export/pagination | Operability | Audit | Medium | Large history difficult | Server-side query/export policy |
| Inbox event/read-state model | Operational inbox | Inbox | Deferred | Route remains locked | New domain/backend |
| Settings mutation contracts | Real configuration | Settings | Deferred | Read-only remains truthful | Auth/audit/rollback required |

Migration 012 must not be altered or applied through UI work. Its reported CRITICAL/HIGH issues require a separate architecture/backend decision.

## BUSINESS ARCHITECTURE MAPPING

UI is a projection of the operating system, not a collection of screens.

```text
Offer → Operation / Workflow → AI Employee → Provider Capability
→ Owner Approval → Manual / Guarded Execution → Evidence
→ Verified Actual Revenue → Actual Cost → Net Profit
→ Performance / Learning / Optimization
```

| Stage | Canonical source | Repository / protected command | Migration | Owner projection | Maturity |
|---|---|---|---|---|---|
| Offer | `affiliate_offers` | Offer Operations / `register_affiliate_offer` | 009 | Economics, market, conditions, readiness | Production foundation |
| Operation | `offer_operations` | Offer Operations / `prepare_offer_operation` | 009 | Lifecycle, next gate, blocker | Production foundation |
| Workflow | `workflow_runs`, `workflow_steps`; future AI task tables | Existing projections; AI runtime requires remediation | 003 / 012 | Stages and responsibility | Conditional |
| AI Employee | definitions/capabilities/tasks/events/handoffs | Employee API Dry Run | 012 | Department, task, handoff, maturity | Conditional / remote NO-GO |
| Provider Capability | connections/capabilities/runtime events | Provider gateway/platform | 010–011 | Business ability, scope, health, quota, cost | Conditional; execution Locked |
| Approval | requests/decisions | Revenue/Operations / `decide_approval` | 003, 007–008 | Decision, impact, expiry, snapshot | Production |
| Package | `execution_packages` | package materialize/retrieve/access commands | 003, 007–009 | Manual readiness and external lock | Production manual boundary |
| Evidence | `evidence_candidates` | `register_revenue_evidence` | 003, 005, 008 | Source and verification gate | Production |
| Actual Revenue | `revenue_records` | `verify_evidence_and_record_revenue` | 003, 008 | Verified Actual by currency | Production |
| Cost / Performance | operating cost/performance records | record cost/performance commands | 009 | Actual cost and outcome | Production foundation |
| Profit | Revenue + actual cost, per currency | `buildProfitByCurrency`; server projection required | 003 / 009 | Net Profit, margin, provenance | Conditional projection |
| Learning | learning/failure records | generate learning / record failure | 009 | Result, failure and next proposal | Foundation; optimization incomplete |

Every UI object must expose its upstream and downstream relationship. Approval without Offer/Operation/snapshot, Evidence without its claim, or Profit without revenue/cost provenance is incomplete.

## REVENUE ENGINE LIFECYCLE

| Stage | Output | Owner question | Truth gate | Current status |
|---:|---|---|---|---|
| 1 Discover | Opportunity / candidate Offer | Is it worth investigation? | No revenue claim | Foundation partial |
| 2 Register | Offer | What are the terms? | Workspace and required fields | Implemented foundation |
| 3 Qualify | Operation candidate | Does it fit cost, market and risk? | Sourced constraints only | Target scoring requires backend |
| 4 Prepare | Operation / Workflow | Who does what and in what order? | No skipped gates | Implemented foundation |
| 5 Produce | Versioned Artifact | Is output reviewable? | No invented success | Domain-dependent |
| 6 Request | Approval Request | What must I decide? | Immutable snapshot | Implemented |
| 7 Decide | Approval Decision | Approve, revise or reject? | Approval does not execute | Implemented |
| 8 Package | Manual Execution Package | Is approved work ready? | Creation ≠ external send | Implemented |
| 9 Execute | Human action | Did the action occur? | External Execution Locked | Manual only |
| 10 Evidence | Evidence Candidate | What proves the outcome? | Candidate ≠ Actual | Implemented |
| 11 Verify | Revenue record | Can it be Actual? | Evidence/Approval/Workspace integrity | Implemented |
| 12 Measure | Actual cost/performance | What did it cost? | Estimate ≠ Actual | Foundation |
| 13 Profit | Net Profit / margin | Did it create profit? | Per currency; no unsupported FX | Conditional projection |
| 14 Learn | Learning/failure | What should change? | Learning does not authorize execution | Foundation |
| 15 Optimize | New decision | What maximizes profit next? | Canonical auditable priority required | Backend Requirement |

The lifecycle has synchronized Executive, Operational and Evidence views. Screens are different views over this lifecycle, not separate products.

## AI ORGANIZATION ARCHITECTURE

The target is an accountable AI organization, not an employee-card gallery. Only Google Operations is currently evidenced; all other departments below are Target Architecture, not implemented employees.

```text
KEVIRIO Owner / CEO
├─ Executive Intelligence — company state and decision preparation
├─ Revenue & Portfolio — offers, economics and profit optimization
├─ Market Intelligence — country, market, competitor and channel
├─ Content & Media — production, localization, calendar and quality
├─ Operations — workflow, Google Operations, handoff and recovery
├─ Finance & Performance — evidence, revenue, cost and profit
├─ Risk & Governance — approval, policy, audit and exceptions
└─ Platform & Provider Operations — capability, health, quota and Cost Guard
```

| Organization layer | Required display | Truth rule |
|---|---|---|
| Department | Purpose, accountable outcome, health | Cannot appear Active without canonical definitions/tasks |
| AI Employee | Role, responsibility, version, maturity | Registry-backed only |
| Capability | Technically possible work | Does not imply Permission |
| Permission | Workspace-authorized work | Scope and Approval remain separate |
| Current Work | Verified task/workflow and stage | No fictional activity |
| Handoff | From/to responsibility, classification, acceptance | Migration 012 integrity remediation required |
| Performance | Outcome, quality, latency, failure, cost | Unknown remains Unknown |
| Owner Intervention | Decision, exception or missing requirement | One reason and destination |

Target views are Organization Map, Responsibility Matrix, canonical Work Queue, Employee Detail and—only after integrity remediation—Handoff Graph. Migration 012 is remote-unapplied and NO-GO, so the UI initially shows the target structure as a design model and Google Operations as Conditional/Locked; it never shows a fictional active organization.

## CEO DESK / HOME ARCHITECTURE

Home is the CEO Desk. Its primary question is:

> 今日、何を判断すれば、制約とリスクを守りながら検証済み純利益を最大化できるか。

First viewport:

1. Company State: Normal / Attention / Blocked with canonical reasons.
2. Next Best Owner Decision: exactly one highest-priority decision.
3. Expected profit effect only when a canonical forecast exists; otherwise Unknown.
4. Verified Net Profit separated by currency and period.
5. Critical constraint: Cost Guard, approval expiry, provider failure or evidence gap.

A future canonical Executive Decision Queue must provide decision ID/source, action, deadline, expected profit effect/confidence, downside, cost ceiling, blocked downstream value, reversibility, freshness, priority reason and calculation version. UI-side heuristic ranking is prohibited. Until that projection exists, Home uses the existing canonical next action and labels profit impact Unknown.

Secondary sections are profit portfolio, expiring/high-impact approvals, lifecycle bottlenecks, AI organization exceptions, provider/Cost Guard exceptions, sourced market portfolio and recent verified learning. Configuration and technical identifiers stay below the executive hierarchy.

## PROVIDER CAPABILITY ARCHITECTURE

Providers are governed business capabilities, not an API-key catalogue.

| Business capability | Provider implementation | Owner-facing outcome | Required gates | Current evidence |
|---|---|---|---|---|
| AI generation/reasoning | OpenAI; others only when allowlisted | Prepare an artifact or analysis | Allowlist, Cost Guard, egress policy, Approval | Guarded sandbox/local; execution Locked |
| Email intelligence | Google Gmail read | Understand permitted mail metadata | OAuth scope, binding, quota, redaction | Dry Run |
| Document intelligence | Google Drive read | Locate permitted business documents | Scope, classification, no raw leakage | Dry Run |
| Calendar intelligence | Google Calendar read | Understand schedules/deadlines | Timezone, recurrence, scope | Dry Run |
| Performance analytics | Analytics/Search Console/YouTube | Measure channel performance | Property allowlist, bounds, quota | Dry Run |
| Design workflow | Canva foundation | Prepare/access governed design work | OAuth, scope, Cost Guard, execution policy | Foundation; live state Unknown |

Capability UI shows business outcome, adapter, read/write class, workspace scope, connection, permission, health, cost/quota, Approval requirement, External Execution state, last verified event and Owner action. “Connected” never means “authorized to execute”; provider brand is secondary metadata.

## COUNTRY / MARKET ARCHITECTURE

The final model is market-based, not a permanent JP/Global binary. JP and Global are initial portfolio lenses.

```text
Portfolio
└─ Market
   ├─ Country / region
   ├─ Language / locale
   ├─ Currency / approved FX provenance
   ├─ Time zone and regulatory constraints
   ├─ Audience / intent and channel mix
   ├─ Offer eligibility and cost structure
   └─ Evidence-verified performance
```

Canonical backend requires market ID/lifecycle, country/region code, locales, reporting currencies, timezone, provider/channel availability, offer restrictions, governed regulatory notes, audience/intent and market-level revenue/cost/profit/evidence.

The Portfolio compares markets without unsupported currency aggregation. Market Detail shows local economics, offers, channels, content and risks. Country and language are separate filters. “Global” is a grouping, never a country or locale. Translation alone is not market readiness.

Current state: no complete canonical market model was found. Market KPI/comparison is a Backend Requirement and remains hidden or explicitly Not Implemented.

## EXECUTIVE KPI ARCHITECTURE

Every KPI requires formula version, period, currency/unit, source, truth class and freshness.

| KPI | Canonical definition | Minimum inputs | Current state |
|---|---|---|---|
| Verified Actual Revenue | Evidence-verified revenue | Verified revenue records | Available |
| Gross Revenue | Revenue before attributable costs | Verified classified revenue | Conditional by source |
| Actual Cost | Recorded operating cost | Cost records by class/currency | Foundation available |
| Net Profit | Verified Actual Revenue − Actual Cost | Same currency/period | Conditional current projection |
| Profit Margin | Net Profit ÷ Verified Actual Revenue | Nonzero verified revenue | Canonical backend calculation recommended |
| Contribution Margin | Revenue − variable attributable cost | Variable/fixed cost classification | Backend Requirement |
| Contribution Margin % | Contribution Margin ÷ Revenue | Same period/currency | Backend Requirement |
| ROI | (gain − investment) ÷ investment | Approved gain/investment attribution | Backend Requirement |
| ROAS | Attributed revenue ÷ advertising spend | Attribution + actual ad spend | Backend Requirement |
| CAC | Acquisition cost ÷ new customers | Customer/acquisition model | Backend Requirement |
| LTV | Customer contribution over a defined horizon | Customer/cohort/repeat revenue | Backend Requirement |
| LTV:CAC | LTV ÷ CAC | Canonical LTV and CAC | Backend Requirement |
| Payback Period | Time until contribution recovers investment | Cohort cash flow | Backend Requirement |
| Revenue per Owner Hour | Verified value ÷ Owner time | Workload/time model | Backend Requirement |
| Profit per AI Cost | Net contribution ÷ AI/provider cost | AI cost attribution | Backend Requirement |
| Evidence Conversion | Verified outcomes ÷ candidates | Evidence lifecycle | Backend projection |
| Approval-to-Profit Lead Time | Decision to verified profit | Canonical timestamps | Backend projection |
| Workflow Throughput | Governed completions per period | Task/workflow events | Migration 012-dependent |
| Failure Cost | Actual cost linked to failures | Failure/cost linkage | Backend Requirement |

Top-level KPIs are Net Profit, margin, cash-impact/constraint and next decision. Diagnostic KPIs are ROI, ROAS, contribution, CAC/LTV and workload. Operational KPIs are throughput, lead time, failure and provider cost. Rates show numerator/denominator. Unsupported KPIs are omitted from executive Production cards; Forecast is never styled as Verified Actual.

## UI–BUSINESS TRACEABILITY MATRIX

| Screen / route | Business domain | Repository / source | Protected RPC / command | Migration | Lifecycle | Decision |
|---|---|---|---|---|---|---|
| `/home` | Executive, Revenue, Operations | Revenue + Offer Operations repositories | Read projections; actions in domain routes | 003–009 | Summary of 1–15 | MODIFY to CEO Desk |
| `/employees/*` | AI Organization | Registry/service; future task/event tables | Employee API Dry Run; atomic runtime required | 012 | Prepare/produce/handoff/measure | CONDITIONAL |
| `/approvals/*` | Owner governance | Revenue repository | `decide_approval` | 003, 007–008 | Request → Decide | KEEP semantics |
| `/operations/*` | Offer/Workflow operations | Offer Operations repository | register/prepare/package/performance/cost/learning/failure | 009 | Register → Learn | KEEP + MODIFY |
| `/revenue/*` | Evidence, Actual, economics | Revenue repository | candidate/package/evidence/verification | 003, 005, 007–008 | Candidate → Actual | KEEP + Profit First |
| `/insights` | Performance/profit | Revenue repository + analytics domain | Read only | 003, 008–009 | Measure → Learn | MODIFY |
| `/integrations/*` | Provider capability | Provider projection/platform | OAuth state/connection server commands | 010–011 | Enable capability | Capability-first MODIFY |
| `/inbox` | Notifications/exceptions | None canonical | None | None | Future exception queue | Truthful Locked |
| `/audit` | Governance/audit | Workspace audit projection | Read only | 003 / provider events 010 | All-stage evidence | KEEP + backend scale requirement |
| `/settings` | Policy/configuration | Static/read-only policy | None | None | Configuration | Truthful read-only |
| `/labs/components` | Design validation | Fixtures | None | None | None | Isolated |
| Market Intelligence | Market architecture | No active repository | None | None | Discover/Qualify | Backend Requirement |
| Content Factory | Artifact production | Legacy only | Package commands are not a full factory | 003/009 partial | Produce/Review | Backend Requirement |
| Media Calendar | Scheduling | None canonical | None | None | Schedule/Execute | Backend Requirement |
| Business Memory | Learning | Historical memory table; no active route | None current | 003 | Learn/Optimize | Backend Requirement |

Every Production KPI/state must map to this matrix or a maintained more-specific mapping. A screen, route or legacy component is not proof that a business capability exists.

## IMPLEMENTATION PLAN

The plan works backwards from a verified final experience; each phase must build and preserve canonical behavior.

### Stage 1 — Truth and identity repair

- Canonical Japanese copy mapping and mojibake correction.
- Gold K favicon and logo asset family specification/implementation.
- State labels and environment labels.
- No IA or business behavior change.

Acceptance: all active Production copy is readable Japanese; no mint/aqua identity asset; source, unit, integration, E2E and build pass.

### Stage 2 — Design System consolidation

- Extend semantic aliases and provenance components.
- Migrate remaining active duplicate visual primitives.
- Preserve existing canonical component APIs where possible.

Acceptance: one active Button/Card/State system; no new dependency; bundle does not regress materially.

### Stage 3 — CEO Desk / Owner Control Plane

- Reorder Home around the highest-value Owner decision and verified profit.
- Add lifecycle, organization, capability and traceability summaries only from canonical projections.
- Use only existing canonical revenue, cost, approval and operation data.
- Render missing profit/company-health data as Unknown or Backend Requirement, never mock.

Acceptance: Owner can locate state, verified profit availability and next action in the first viewport.

### Stage 4 — Revenue lifecycle and core domain refinement

- Approvals, Operations, Revenue and Insights.
- Connect Offer → Workflow → Approval → Evidence → Profit through contextual navigation.
- Add Profit First labels, formula metadata, bottleneck, provenance and responsive summaries.
- No RPC/repository changes.

### Stage 5 — AI Organization and Provider Capability truth

- Organization Map, Responsibility Matrix and maturity presentation.
- Business capability precedes vendor/API presentation.
- Migration 012 NO-GO displayed as Conditional/Locked without internal security detail.
- Provider connection/permission/health/execution separated.

### Stage 6 — Market and Executive KPI readiness

- Do not create Production market/KPI UI until the listed Backend Requirements exist.
- After separate approval, expose country/market portfolio and canonical ROI/ROAS/LTV/CAC/contribution metrics with formula version and provenance.
- Preserve currency and Evidence gates.

### Stage 7 — Utility and responsive closure

- Audit, Inbox, Settings.
- Desktop/laptop/tablet/iPad/mobile.
- Keyboard, screen reader, reduced motion and performance verification.

### Stage 8 — Browser and Owner closure

- Authenticated browser validation.
- Screen scores across Brand, Information, Interaction, Accessibility, Performance, Consistency, Data Truth, Responsive, Motion and Owner Experience.
- Owner review and explicit approval.
- Only then may “Completed / Final / Approved / Freeze” be used.

New domain screens are not part of these UI-only stages until their Backend Requirements are separately approved and implemented.

## VALIDATION PLAN

- Source: route/reachability, mock separation, copy encoding, architecture boundaries.
- Build: Vite production build and chunk report.
- Unit: Design System, semantic states, money, routing, screen contracts.
- Integration: repository/RPC preservation and domain mappings.
- E2E: canonical workflow gates.
- Browser: all routes with authenticated Owner session.
- Responsive: 1920, 1440, 1280, 1024, 834/768 and 390/375 widths.
- Accessibility: keyboard, focus, landmarks, headings, labels, ARIA, contrast, screen reader, touch targets.
- Performance: initial/lazy JS, CSS, chunk count, layout shift, long tasks and request count.
- Motion: token usage, no blocking, reduced-motion parity, mobile/GPU sanity.
- Data Truth: source mapping and maturity label for every KPI/state.
- Owner Review: 10-dimension score; each dimension ≥90 only with evidence.

Current browser-dependent dimensions remain NOT VERIFIED and cannot receive a passing score.

## RISKS

1. Active mojibake can make actions and state labels unsafe.
2. Favicon and application mark communicate two different brands.
3. Requested target domains exceed current canonical backend coverage.
4. Migration 012 is Owner-reported remote-unapplied and NO-GO.
5. A large Home redesign could invent company-health or profit metrics.
6. Duplicate legacy component/data graphs can leak mock semantics.
7. New charts or motion can regress the stable bundle.
8. Browser and visual validation are blocked.
9. Current working tree contains Owner-owned changes that must be preserved.
10. Historical documents may describe earlier maturity states.

## OWNER DECISIONS

1. Approve this `CONDITIONAL GO` design direction?
2. Approve Gold K as the single icon identity and replacement of the mint/blue favicon?
3. Identify the canonical Japanese copy source for mojibake repair?
4. Approve the proposed Control/Growth/System navigation grouping without adding new routes?
5. Approve Net Profit as Home’s primary monetary KPI, with explicit Unknown when unavailable?
6. Approve Backend Requirement discovery for company health, cost composition and revenue engines?
7. Confirm Migration 012 remains outside UI implementation and NO-GO?
8. Approve removal candidates only after reachability/import evidence?
9. Provide an authenticated browser validation environment/session?
10. Approve staged implementation beginning with Truth and Identity Repair?

## VERDICT BASIS

The verdict is based on active route/source inspection, Design System exports/tokens, repository-backed screen implementations, brand assets, existing automated validation and the Owner-reported remote migration state in the 2026-08-01 directive.

The existing architecture is reusable and should not be redesigned. The current UI cannot be declared complete because Japanese copy, identity consistency, information architecture, target-domain coverage and browser evidence do not satisfy the Definition of UI Done. A guarded incremental implementation is therefore **CONDITIONAL GO**, while Production completion remains **NO-GO**.
