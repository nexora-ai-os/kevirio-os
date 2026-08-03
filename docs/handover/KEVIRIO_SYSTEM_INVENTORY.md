# KEVIRIO System Inventory

## 1. Control

- Date: 2026-08-01 JST
- Branch: `feat/revenue-repository-integration-v1`
- HEAD: `4837c813c75794837ef10d83c564afdee87f3761`
- Scope: repository evidence; remote state is not inferred.
- Full narrative: `KEVIRIO_PROJECT_MASTER_HANDOVER_CURRENT.md`

## 2. Repository Topology

```text
kevirio-os/
├─ api/                    Vercel serverless entry points
├─ docs/                   governance, architecture, audit, handover
├─ public/                 static assets
├─ scripts/                validation/operations scripts
├─ server/                 server-only auth/provider/runtime
├─ src/
│  ├─ components/          shared and domain UI
│  ├─ contexts/            authentication/theme
│  ├─ data/                fixtures and registries
│  ├─ hooks/               UI/application hooks
│  ├─ lib/                 clients, utilities, policy helpers
│  ├─ pages/               route screens
│  ├─ repositories/        production data boundary
│  ├─ services/            application/domain services
│  ├─ styles/              global/design-system CSS
│  └─ types/               domain/UI types
├─ supabase/migrations/    SQL 001–012
├─ tests/                  unit, integration, E2E
├─ package.json
├─ vite.config.js
└─ vercel.json
```

The file-by-file `src/` tree is in the master handover. Generated output and dependencies are not product source.

## 3. Stack

| Area | Inventory |
|---|---|
| Client | React/React DOM 19.2.7 SPA |
| Router | React Router DOM 7.18.2, `BrowserRouter`, lazy routes |
| Build | Vite 8.1.3, React plugin 6.0.3 |
| Language | JavaScript/JSX; TypeScript Not Implemented |
| Backend | Vercel handlers + Supabase/PostgreSQL RPC |
| Client SDK | Supabase JS 2.110.7 |
| Icons | Lucide React 1.23.0 |
| Package manager | npm/lockfile |
| Observed runtime | Node v24.18.0, npm 11.16.0 |
| Hosting | Vercel config exists; project/deploy state Unknown |

## 4. Routes

| Routes | Purpose/status |
|---|---|
| `/home` | Home |
| `/employees`, `/employees/:employeeId`, `/employees/:employeeId/tasks/:taskId` | AI Employee list/detail/task |
| `/approvals`, `/approvals/:approvalId` | Approval list/detail |
| `/operations`, `/operations/offers`, `/operations/workflows`, `/operations/:operationId` | Operations |
| `/revenue`, `/revenue/actual`, `/revenue/forecast`, `/revenue/evidence`, `/revenue/campaigns`, `/revenue/records/:recordId` | Revenue; forecast/evidence remain distinct from Actual |
| `/insights`, `/integrations`, `/integrations/:providerId` | Insights/provider platform |
| `/inbox` | UI route; backend workflow Not Implemented |
| `/audit` | Audit projection |
| `/settings` | UI route; mutations Not Implemented |
| `/labs/components` | verified Owner + `VITE_DEVELOPER_MODE=true`; fixtures only; disabled returns 404 |
| `/` | redirects to `/home` |
| unknown | 404 |

Legacy redirects: `/production`, `/approval`, `/campaign`, `/analytics`, `/provider-hub`, `/google-operations`. Labs is not in Production navigation.

## 5. Frontend/UI

- Shared shell: responsive sidebar, topbar, content container, page wrapper/header.
- Tokens: semantic color, typography, spacing, radius, shadow, motion; ThemeProvider.
- Primitives: Button, Badge, Card, Empty/Error/Loading State, Skeleton.
- Domain presentation includes KPI, AI Employee, Approval, table/list, money and Owner-action components.
- Approved palette: White, Champagne Gold, Silver, Soft Blue, Pale Purple.
- CSS uses shared token/global and component/screen layers. Tailwind is absent.
- Labs is fixtures-only. Mock APIs remain explicitly Mock.
- Limited direct Supabase production reads exist in Canonical Audit and Provider Hub after membership resolution. Primary domain reads otherwise use repositories/services.
- File existence does not imply reachability; the route registry is authoritative.

## 6. Data/Service Boundaries

### Revenue repository

Loads workspace context/snapshots; lists opportunities, campaigns, approvals, evidence and Actual Revenue. Commands cover candidate creation, approval decisions, manual-package generation/retrieval/access, evidence registration and revenue verification.

### Offer Operations repository

Loads context/snapshots. Commands cover offer registration, operation preparation, approval, package access, performance, operating cost, learning and failure telemetry.

### Server

Local development transport; verified Owner context; Supabase server client/runtime/usage; provider gateway/platform/connection/adapters/OAuth; OpenAI gateway/adapter. Provider tokens and service-role secrets are server-only.

## 7. HTTP APIs

| Method | Endpoint | Inventory |
|---|---|---|
| GET | `/api/status` | Safe Mock status; not production-health proof |
| POST | `/api/ai` | Default local Mock; sandbox revenue lanes require verified Owner, explicit enablement and usage store |
| POST | `/api/orchestrate` | Mock-only |
| POST | `/api/provider` | Verified Owner/workspace; dry run or Google/Canva OAuth begin/complete |
| POST | `/api/employee` | Verified Owner/workspace; dry run only; Google API calls = 0 |

No public unauthenticated mutation API was evidenced.

## 8. Providers and AI Employee

Identifiers: OpenAI, Anthropic, Gemini, Perplexity, Google, Canva. Google/Canva OAuth source exists; live state is Unknown. External execution gates fail closed. Autonomous and batch execution are disabled by defaults.

Generation allowlist evidence: OpenAI `gpt-5-nano`. Registry health evidence includes Gemini 2.5 Flash and Perplexity Sonar.

AI Employee registry contains `google_operations`, version `1.0.0`, maturity `Conditional`, external execution false. Dry-run capabilities cover Gmail, Drive, Calendar, Analytics, Search Console and YouTube. Live Google execution is Not Implemented/disabled.

## 9. Database

Repository migrations define 48 tables.

| Migration | Tables |
|---|---|
| 001 | `owner_profiles`, `sandbox_usage_monthly`, `sandbox_request_reservations`, `sandbox_generation_cache` |
| 003 | `workspaces`, `workspace_members`, `brand_profiles`, `clients`, `opportunities`, `owner_decisions`, `campaigns`, `tasks`, `artifacts`, `approval_requests`, `approval_decisions`, `execution_packages`, `evidence_candidates`, `revenue_records`, `workflow_runs`, `workflow_steps`, `business_memory_records`, `audit_logs` |
| 009 | `affiliate_offers`, `offer_operations`, `platform_connections`, `performance_records`, `operating_cost_records`, `learning_records`, `operation_failures` |
| 010 | `provider_cost_policies`, `provider_model_allowlist`, `provider_budget_reservations`, `provider_usage_ledger`, `provider_circuit_breakers`, `provider_execution_events` |
| 011 | `provider_connections`, `provider_oauth_states`, `provider_capabilities`, `provider_health_events`, `provider_pricing_versions` |
| 012 | `ai_employee_definitions`, `ai_employee_capabilities`, `ai_employee_tasks`, `ai_employee_task_events`, `ai_employee_handoffs`, `google_workspace_bindings`, `google_quota_policies`, `google_quota_usage` |

Migrations 002 and 004–008 alter functions/grants/constraints/policies/indexes without tables. Remote through 009 is Owner-reported applied on 2026-07-27; 010–012 are Unknown.

RPC capabilities: sandbox reserve/commit/release; active-member check and Owner bootstrap; revenue candidate/approval/package/evidence/verification; offer registration/preparation/package/performance/cost/learning/failure; provider-budget reserve/finalize/release; OAuth-state consumption and provider disconnect. Exact signatures/grants are canonical in SQL.

## 10. Domain Semantics

- Approval is a protected transition, not visual status.
- Execution packages preserve manual/external boundaries and access telemetry.
- Evidence candidates are distinct from verified revenue.
- Actual Revenue requires verification plus approval/integrity checks.
- Workspace membership and RLS/RPC enforce access; UI filtering is insufficient.
- Autonomous queue/scheduler execution is Not Implemented.

## 11. Cost Guard

Recorded defaults: JPY; request ¥5, hourly ¥20, daily ¥100, monthly ¥1,000; input/output/total tokens 4,000/800/4,800; one request/job, three/workflow, concurrency one, batch false, autonomous false, retry one. Migration 010 defines policy, allowlist, reservations, ledger, breakers and events; remote availability is Unknown.

## 12. Configuration Names

Values are excluded.

- Supabase: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`.
- Provider keys: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `PERPLEXITY_API_KEY`, `GEMINI_API_KEY`.
- Sandbox/origin: `KEVIRIO_OPENAI_SANDBOX_ENABLED`, `KEVIRIO_ALLOWED_ORIGIN`.
- OAuth: Google/Canva client ID/secret, `OAUTH_TOKEN_ENCRYPTION_KEY`, `OAUTH_REDIRECT_BASE_URL`, provider OAuth enable flags.
- Execution: global and provider-specific execution-enable flags.
- Guard: request/hour/day/month JPY and input/output/total token limits.
- Google: six read-enable flags plus Analytics property, Search Console site and YouTube channel identifiers.
- Deployment/dev: `BASIC_AUTH_USER`, `BASIC_AUTH_PASSWORD`, `VITE_DEVELOPER_MODE`.

Exact names are enumerated in the master handover and `.env.example`.

## 13. Tests, Docs, and External State

- Tests: 26 unit files, 16 integration files, 2 E2E files; latest evidence 164/164, 85/85, 2/2.
- Policy/security: 273 source files; credential boundary 27/27, exposure 20/20, migration foundation 18/18.
- Governance V2.1 remains `DRAFT — OWNER REVIEW REQUIRED`.
- `docs/audit.zip.zip` is untracked, provenance Unknown, and intentionally untouched.
- GitHub HEAD evidence exists. Vercel linkage, Preview variables/deploy, browser Owner session, provider connections, remote 010–012 and first real sale are Unknown or blocked as documented.
