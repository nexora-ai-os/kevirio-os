# KEVIRIO Architecture and Production Baseline

| Metadata | Value |
| --- | --- |
| Document name | KEVIRIO Architecture and Production Baseline |
| Version | 2.1 |
| Status | DRAFT — OWNER REVIEW REQUIRED |
| Effective date | Not Effective — Owner approval required |
| Owner | KEVIRIO Owner |
| Supersedes | None until approved; intended to replace stale point-in-time architecture summaries after approval |
| Source of Truth level | Tier 2 after explicit Owner approval |
| Last reviewed | 2026-07-31 |
| Change summary | Records the repository-evidenced SPA, data, security, route, feature maturity, and constraints. |

## 1. System identity

| Item | Current evidence |
| --- | --- |
| Repository | `kevirio-os` |
| Current branch | `feat/revenue-repository-integration-v1` |
| Baseline HEAD | `4837c813c75794837ef10d83c564afdee87f3761` |
| Frontend | React `19.2.7`, JavaScript/JSX |
| Routing | React Router DOM `7.18.2`, BrowserRouter, SPA history and deep-link fallback |
| Build/runtime | Vite `8.1.3`; browser SPA plus local Node server scripts |
| Authentication | Supabase Auth `signInWithPassword` plus `owner_profiles` role/status verification |
| Database | Supabase/PostgreSQL with RLS and protected RPC contracts |
| Hosting | Vercel configuration exists with SPA fallback; deployed environment state is Unknown |
| Providers | Server-bound platform contracts for OpenAI, Anthropic, Gemini, Perplexity, Google, and Canva; live execution remains locked |
| Environment | Vite public configuration for browser-safe Supabase identifiers; server-only provider secrets; Developer Mode only from `VITE_DEVELOPER_MODE` and fail-closed |

Secrets and credential values are excluded from this baseline.

## 2. Route baseline

Production routes are Owner-auth-gated before the application router renders. `/labs/components` additionally requires successful Owner authentication and `VITE_DEVELOPER_MODE=true`; otherwise it returns 404 and is absent from Production navigation.

| Area | Canonical routes |
| --- | --- |
| Home | `/home` |
| AI Employees | `/employees`, `/employees/:employeeId`, `/employees/:employeeId/tasks/:taskId` |
| Approvals | `/approvals`, `/approvals/:approvalId` |
| Operations | `/operations`, `/operations/offers`, `/operations/workflows`, `/operations/:operationId` |
| Revenue | `/revenue`, `/revenue/actual`, `/revenue/forecast`, `/revenue/evidence`, `/revenue/campaigns`, `/revenue/records/:recordId` |
| Insights | `/insights` |
| Integrations | `/integrations`, `/integrations/:providerId` |
| Inbox | `/inbox` |
| Audit | `/audit` |
| Settings | `/settings` |

Route-level lazy loading exists for the application and component Labs, and screen-level lazy loading exists inside the application shell.

## 3. Current feature maturity

Classification describes the current repository and declared remote evidence; it is not an Owner visual-acceptance claim.

| Capability | Maturity | Evidence and boundary |
| --- | --- | --- |
| Owner Auth | CONDITIONAL | Supabase session, password sign-in, Owner role/status verification, timeout and fail-closed states exist. Live browser revalidation is blocked. Password recovery is Not Implemented. |
| Home | CONDITIONAL | Canonical repositories and truthful empty/error states are wired; environment and authenticated browser state are required. |
| AI Employees | CONDITIONAL | Registry and Google Operations Dry Run contracts exist; external execution is false. |
| Approvals | CONDITIONAL | Production repository/RPC boundary and Owner decision UI exist; live authenticated verification remains required. |
| Operations | CONDITIONAL | Canonical offer operations and manual execution package exist; no automated external send is enabled. |
| Revenue | CONDITIONAL | Production repository, Evidence and Actual-only analytics contracts exist; remote/environment verification remains a gate. |
| Insights | CONDITIONAL | Canonical production reads are supported; Actual is separated from non-Actual data. |
| Integrations | CONDITIONAL | Provider connection/readiness contracts exist without credential disclosure; live provider execution is locked. |
| Inbox | LOCKED | No Production Inbox repository or source exists. The screen renders an explicit empty state. |
| Audit | CONDITIONAL | Append-only audit repository display exists; authenticated remote availability is required. |
| Settings | LOCKED | Informational policies exist; Workspace changes, feature flags, Developer Mode controls, and credential settings UI are Not Implemented. |
| External Execution | LOCKED | Global/provider flags, approvals, Cost Guard, and gateway checks fail closed. No Production external send is enabled. |
| AI Generation | MOCK | OpenAI generation contract returns mock-only output; live execution is false. |
| Manual Publishing | CONDITIONAL | Manual execution package/export preparation exists. Publishing itself is a human external action and is not executed by KEVIRIO. |
| Actual Revenue | CONDITIONAL | Canonical `revenue_records`, Evidence and verification contracts exist; Mock/Forecast/Test/pending Evidence are excluded. |
| Mock Revenue | MOCK | Explicit mock flows remain for simulation and cannot become Actual silently. |
| Provider Connections | CONDITIONAL | Provider platform, OAuth/runtime models and connection views exist; credentials and remote connection state depend on server environment. |
| Cost Tracking | CONDITIONAL | Reservations, usage ledger, pricing checks, budgets, circuit breaker and Cost Guard exist; live usage requires configured provider runtime. |
| Evidence | CONDITIONAL | Revenue Evidence schema/RPC/repository semantics exist; remote authenticated confirmation remains required. |
| Owner Verification | CONDITIONAL | Active Owner profile verification is implemented; current live browser validation is blocked. |

## 4. Authentication baseline

- The browser creates one Supabase client from `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
- `signInWithPassword({ email, password })` receives the controlled input values without normalization or persistence.
- A session is insufficient by itself: `owner_profiles.role` must equal `owner` and `status` must equal `active`.
- Session restoration, auth-state changes, token refresh failure, provider unavailability, non-Owner, inactive Owner, and a 12-second verification deadline are handled fail-closed.
- Password visibility and Caps Lock assistance exist. Errors are mapped without user enumeration.
- Password recovery is Not Implemented. No reset button, link, modal, or persistence layer is authorized.

## 5. Data and database baseline

Migration files `001`–`013` exist. Owner-reported Production evidence confirms Migration `012` was applied successfully on 2026-08-03 after a PASS pre-check. The corrected read-only post-apply smoke completed with `Success. No rows returned`. Migration `012` SHA-256 is `8BB9F43332ABCE4BFB5C71703D5C4791EE3F0E2511CE6CBB5BB7D46362A88B83`. Migration `013` is a local candidate only and has not been applied remotely.

- `001`–`002`: earlier revenue activation and reusable sandbox reservation foundations.
- `003`: production revenue foundation, business tables, RLS and integrity baseline.
- `004`: additive Owner workspace bootstrap/read access.
- `005`: production revenue repository RPC integration.
- `006`: additive revenue integrity trigger correction.
- `007`: manual execution package.
- `008`: revenue MVP completion.
- `009`: canonical offer operations; Owner-recorded as applied.
- `010`: provider Cost Guard foundation.
- `011`: provider integration platform.
- `012`: AI Employee platform.

Migrations `003`–`009` are protected history and must never be edited in place. All further database changes are additive migration `010+`; existing numbering must not be rewritten. RLS, authenticated workspace membership, protected mutation RPCs, immutable approval/evidence semantics, and Actual-only analytics remain architectural boundaries.

## 6. Workspace and repository boundaries

- Owner access resolves a single authorized workspace context; ambiguous, missing, inactive, or failed context does not fall back to another workspace.
- Production reads and mutations use the existing repository layer and protected RPCs. UI components must not bypass repositories or query around RLS.
- Browser table access remains read-oriented; protected writes remain RPC-only where defined.
- Legacy localStorage and fixtures are not canonical Production data and cannot be automatically imported as Actual.

## 7. Provider and external execution baseline

- Supported platform identifiers are `openai`, `anthropic`, `gemini`, `perplexity`, `google`, and `canva`.
- Credential material is server-only. Client UI may show redacted state, never values.
- Global execution and provider execution flags default disabled; missing or indeterminate configuration fails closed.
- Dry Run produces no external request. Approval-required request classes require a matching, unexpired, one-time Approval snapshot.
- Provider/model allowlists, pricing freshness, estimated maximum cost, reservation/ledger state, quota/budget, idempotency, retry classification, and circuit breaker are enforced by existing contracts.
- OpenAI Production generation is Not Implemented; the current generation contract is MOCK.
- Telemetry fields required by the Constitution must be preserved when present. Repository-wide proof that every path records prompt version/hash/model/temperature/input/output/cost/latency is Unknown and must not be claimed.

## 8. UI baseline

The current worktree contains an Owner-directed reconstruction toward the approved white/champagne-gold/silver/soft-blue/pale-purple design, a shared shell, design tokens, shared components, Japanese copy work, responsive layouts, and production screen migrations. Source tests and builds can validate implementation structure; they do not replace visual browser review.

| Validation label | Current state |
| --- | --- |
| Implemented in source | Yes, with uncommitted Owner work preserved |
| Source validated | Must be rerun for this governance change |
| Browser validated | PASS — authenticated Windows-native Playwright, 10 Production routes, 104/104 checks |
| Owner approved as final UI | No evidence for the current uncommitted reconstruction |
| Still under reconstruction | Yes |

The UI must not be labeled `FINAL`, `COMPLETE`, `PRODUCTION VISUALLY VALIDATED`, or `OWNER APPROVED` until real browser review and explicit Owner approval occur.

## 9. Known constraints and risks

- Browser validation is currently blocked by the in-app Browser sandbox ACL.
- Preview/Production environment variables and current deployment state are Unknown locally.
- Password recovery is Not Implemented.
- External Execution and live AI generation remain locked/mock.
- The working tree contains intended but uncommitted Owner UI/auth changes and an intentionally excluded `docs/audit.zip.zip` artifact.
- Older audit reports describe earlier states and may conflict with later migrations or UI work; their date and scope must be considered.
- React Router has an RSC-related advisory recorded as a known risk; no repository evidence currently shows use of React Server Components or RSC Mode in this Vite SPA.

## 10. Feature Lifecycle

Every feature moves through the following governed lifecycle:

`Idea → Research → Design → Prototype → Mock → Conditional → Production → Deprecated → Archived → Removed`

- A feature must not jump from Prototype to Production.
- Mock must never be represented or operated as Production.
- Conditional must retain its unresolved gates until they are evidenced as complete.
- Deprecated functionality must receive an explicit migration, archival, or removal decision and must not be abandoned indefinitely.
- Archived functionality is retained only according to its declared evidence, audit, retention, and recovery requirements.
- Removed functionality must leave no misleading navigation, capability claim, or unsupported data path.

Lifecycle promotion requires evidence appropriate to the target state and the applicable Validation Level in the Runbook.

## 11. KPI Governance

KPI definitions do not change by screen. Each KPI must resolve to one canonical definition, truth class, unit, time boundary, workspace boundary, and data source.

The minimum governed KPI vocabulary is:

- Revenue
- Cost
- Profit
- Approval
- Execution
- Failure
- Lead
- Conversion
- Actual
- Forecast
- Mock
- Evidence

All screens, repositories, exports, and reports must maintain a Single Source of Truth for these definitions. A missing canonical definition is `Unknown`; a screen must not create a local substitute. Actual, Forecast, and Mock remain mutually distinguishable, and Evidence state must accompany claims that require verification.

## 12. V1 Company Operating System candidate baseline — 2026-08-03

The implemented V1 candidate extends the presentation/domain contract with a ten-item Owner Control Plane and a 21-stage Company Operating Cycle. Stage state requires exact canonical evidence; missing facts are Unknown or Not Started and cannot be converted into completion. The fixed cycle status vocabulary is: Not Started, Ready, Waiting, In Progress, Blocked, Awaiting Approval, Manually Executed, Evidence Pending, Completed, Failed, Cancelled, and Unknown.

Migration 013 is not part of the Production baseline until the Owner applies it and its read-only smoke passes. The fixed candidate SHA-256 is B5DE02C52806E30F76565C9045C9E4E7FD9CCC5365973C746AB7EF6F563365BB. It defines six locked Revenue Engine types and eight workspace-scoped Company Operating System objects, with Revenue learning isolated in `revenue_learning_records` and the Migration 003 `business_memory_records` boundary unchanged. Browser roles remain read-only, service mutation remains protected, External Execution remains locked, and Validation SQL is read-only/rollback bounded.

Current validation evidence is recorded in docs/validation/V1_EMERGENCY_COMPLETION_VALIDATION_2026-08-03.md. Current activation instructions are recorded in docs/validation/MIGRATION_013_OWNER_ACTIVATION_PACKAGE.md. Until the Owner reports an exact post-apply PASS, the release state is Conditional and the Production schema claim for Migration 013 remains Not Applied.
