# KEVIRIO PROJECT MASTER HANDOVER

## Current status override — 2026-08-20 REAL OPERATIONS

This section supersedes older phase/readiness statements in this draft where they conflict.

- Product Phase: `REAL_OPERATIONS_PRIVATE_BETA`.
- Gemini Verdict: `REAL_OPERATIONS_AI_READY`.
- Owner iPad acceptance: PASS on canonical Private Beta release `805c347`.
- Acceptance evidence: Provider Gemini; Mode LIVE AI; Cost FREE; exactly three priorities; data basis limited to explicit Owner text; local fallback not used.
- New feature development: FROZEN by default. Reopen only for evidenced operational `BUG`, `UX`, `IDEA`, `MISSING`, or `AUTOMATION_CANDIDATE` work accepted through 改善BOX.
- Improvement policy: use real operational data and preserve Workspace, Member privacy, RLS, credential, truth, Cost Guard, Approval, Evidence, Actual, Audit, and External Execution boundaries.
- Paid AI remains ¥0; paid fallback OFF; External Execution LOCKED.
## Current status override — 2026-08-03

This section supersedes older status statements in this draft where they conflict.

- Migration 012 Production activation: SUCCESS (Owner-confirmed).
- Pre-check: PASS.
- Corrected read-only post-apply smoke: PASS (`Success. No rows returned`).
- Applied Migration 012 SHA-256: `8BB9F43332ABCE4BFB5C71703D5C4791EE3F0E2511CE6CBB5BB7D46362A88B83`.
- Authenticated Windows-native Browser Validation after the current UI integration: 104/104 PASS across ten Production routes.
- Migration 013: local candidate only; Not Applied to Production.
- External Execution: LOCKED. No OAuth authorization, Provider execution, Production data mutation, commit, push, or deploy occurred.

## 1. Document Control

| Field | Value |
| --- | --- |
| Document title | KEVIRIO PROJECT MASTER HANDOVER — CURRENT |
| Version | 1.0 |
| Generated | 2026-08-01 JST |
| Repository | `kevirio-os` |
| Branch | `feat/revenue-repository-integration-v1` |
| HEAD | `4837c813c75794837ef10d83c564afdee87f3761` |
| Working tree | Dirty: tracked Owner UI/governance changes plus untracked documents/assets |
| Authoring mode | READ-ONLY audit; documentation-only writes |
| Status | CURRENT DRAFT — Owner review required |
| Owner | KEVIRIO Owner |
| Source-of-truth position | Current evidence-based handover; latest explicit Owner decisions retain priority |
| Supersedes | No approved document automatically; intended current restart reference |
| Effective status | Draft until Owner approval |

Evidence: `AGENTS.md`, Governance Index, `git status`, `git rev-parse HEAD`.

## 2. Executive Summary

KEVIRIO is an Owner-operated AI Company Operating System. It governs AI Employees, business workflows, exact-snapshot approvals, manual execution packages, Evidence, Actual Revenue, Provider permissions, cost control and audit trails. It is not an autonomous company and not a generic dashboard.

The Vite/React SPA, Owner authentication gate, ten Production routes, repositories, Supabase migrations 001–012, Provider/Cost Guard contracts and Google Operations Dry Run exist. Revenue and offer workflows are implemented against canonical repositories and protected RPCs. Actual Revenue is conditional on Evidence and Owner approval. Provider live execution is locked. OpenAI UI/provider contract is Mock unless the separately gated sandbox path is used. Inbox backend, Settings mutations and Password Recovery are Not Implemented. Remote application of migrations 010–012, Preview/Production environment configuration, live Provider connections and deployment state are UNKNOWN. Authenticated Browser validation is BLOCKED.

Release readiness: Build Validated (Level 2), not Browser Validated. Immediate target: verify remote migration/environment state and establish an authenticated Preview/Browser validation path without changing UI or safety contracts.

## 3. Product Definition

- Operating cycle: **Build → Activate → Operate → Measure → Improve**.
- Owner makes final business, financial, approval, provider, execution and release decisions.
- AI Employees prepare, analyze and execute only within explicit task, permission, workspace, cost and Approval boundaries.
- Profit First: Revenue, Cost and Profit retain canonical definitions and truth classes.
- Product target recorded in historical architecture: first real revenue within 30 days; repository evidence does not prove that target was achieved.
- External Execution is locked. Manual Execution Package means Owner-copy/download preparation, not delivery or publishing.
- Evidence First: Actual Revenue requires accepted Evidence, exact Approval and protected registration.
- Truth classes: Production, Actual, Forecast, Mock, Sample, Test, Unconnected and Unknown are distinct; Unknown is never zero.

Evidence: Constitution §§1–5; `docs/architecture/CANONICAL_OPERATING_MODEL.md`; migrations 003/005/007/008/009.

## 4. Governance and Development Constitution

Governance V2.1 files are **DRAFT — OWNER REVIEW REQUIRED**, not effective. Latest explicit Owner decisions take precedence. Fixed decision order: Security, Data Integrity, Business Value, UX, Maintainability, Performance, Visual Beauty.

- Lifecycle: Idea → Research → Design → Prototype → Mock → Conditional → Production → Deprecated → Archived → Removed.
- Validation: Source, Build, Browser, Owner Approved.
- DoD requires relevant tests/build/security/browser evidence and explicit Owner review.
- Commit, Push and Deploy require separate approvals.
- UI Freeze: only evidenced bugs, accessibility/responsive defects, contract violations and real operational UX problems may reopen base UI.
- Migrations 003–009 are immutable history; future DB work is additive and must not renumber artifacts.
- Clean rule: no unresolved TODO/FIXME/console.log/debugger/secrets in intended Production scope.
- AI Employee Production eligibility requires Role, Permission, Input, Output, Failure, Retry, Approval, Evidence, Metrics, Cost, Latency, Version and Prompt Hash.
- KPI definitions are single-source and truth-classed.
- External Provider additions require server-only credentials, verified Owner/workspace context, allowlists, Cost Guard, bounded retry, audit and fail-closed execution.

## 5. Current Maturity Map

| Feature | Status | Data source / effect | Coverage / limitation |
| --- | --- | --- | --- |
| Owner Auth | CONDITIONAL | Supabase Auth + `owner_profiles`; no external business effect | Unit/integration tested; browser blocked; recovery absent |
| Workspace | CONDITIONAL | Supabase `workspaces/workspace_members/brand_profiles` | Exactly one active Owner workspace expected |
| UI + ten routes | CONDITIONAL | Production repositories/registries | Build-tested; authenticated visual evidence blocked |
| Home | CONDITIONAL | Revenue + Offer repositories | Remote state required |
| AI Employees | CONDITIONAL | Registry; Google Dry Run | No live Google calls |
| Approvals | CONDITIONAL | Revenue repository + `decide_approval` | Hold deferred |
| Operations | CONDITIONAL | Offer repository | Manual external action only |
| Revenue / Actual | CONDITIONAL | Revenue repository; Evidence gated | Remote 008/009 state must be verified |
| Insights | CONDITIONAL | Actual-only repository projection | No verified data means locked/empty |
| Integrations | CONDITIONAL | read-only provider connection projection | Credentials never selected |
| Inbox | LOCKED | None | Backend Not Implemented |
| Audit | CONDITIONAL | `audit_logs`, redacted read | Export/search/pagination absent |
| Settings | LOCKED | policy presentation only | Mutations Not Implemented |
| Cost Guard | CONDITIONAL | Runtime + migration 010 | Remote 010 UNKNOWN |
| Provider/OAuth | CONDITIONAL | server runtime + migration 011 | Environment/live connection UNKNOWN |
| Google Operations | MOCK/CONDITIONAL | deterministic Dry Run | API request count 0 |
| OpenAI contract | MOCK | local mock; optional gated sandbox path | Production generation Not Implemented |
| Anthropic/Gemini/Perplexity/Canva | LOCKED/CONDITIONAL | registry/runtime contracts | No proven Production execution |
| AI Employee platform | CONDITIONAL | registry + migration 012 | one formal employee; remote 012 UNKNOWN |
| External Execution | LOCKED | all gates fail closed | no Production send/publish |
| Manual Package | CONDITIONAL | protected RPC, audited view/copy/download | delivery is human action |
| Deployment/Preview/Production | UNKNOWN | Vercel config exists, project unlinked | no environment/browser evidence |

Detailed evidence: [System Inventory](docs/handover/KEVIRIO_SYSTEM_INVENTORY.md).

## 6. User Roles and Permission Model

Current verified role is active `owner`. Browser session alone is insufficient: `owner_profiles.role=owner` and `status=active` are required. Workspace access is derived from active `workspace_members`; ambiguity fails closed. RLS protects tables; protected mutations use RPCs. Provider permissions are separate from connection, scope, Cost Guard and execution switches. AI task permissions are task/scope/approval bounded. Staff, Admin UI, organization hierarchy, workspace switching and a verified multi-user product contract are Not Implemented.

## 7. End-to-End Business Workflow

| Stage | Input → output | Contract / effect / failure |
| --- | --- | --- |
| Offer | Owner offer → `affiliate_offers` | `register_affiliate_offer`; workspace/idempotency validation |
| Intelligence/Strategy/Content | Offer → immutable snapshots | `prepare_offer_operation`; inference/forecast remains labeled |
| Approval request | Artifact snapshot → pending request | exact version/hash/expiry semantics |
| Owner decision | approve/reject/revise | `decide_approval`; no optimistic UI; Approval does not execute |
| Manual package | approved snapshot → package | generation/retrieval/access RPCs; copy/download audited |
| Publish/Schedule | Owner external action | KEVIRIO does not send or publish |
| Performance/Cost | Owner reference + metrics/cost | protected operation RPCs; test/forecast distinct |
| Evidence | source reference, amount, cost, currency, date/note | `register_revenue_evidence`; duplicate/invalid blocked |
| Actual Revenue | verified Evidence + Approval → record | `verify_evidence_and_record_revenue`; atomic and gated |
| Learning | performance → generated inference | `generate_operation_learning`; not Actual Revenue |
| Audit | command/access/failure → append-only record | sanitized metadata; display failure does not modify data |

Retry is bounded and only used where classified safe. Owner must correct invalid input, expired Approval, missing Evidence, missing scopes or remote failures rather than bypassing a gate.

## 8. System Architecture

```text
Browser
  └─ SupabaseOwnerAuthGate
      └─ BrowserRouter / AppRouter
          └─ lazy App → ApplicationShell → lazy Production screen
              ├─ revenueRepository ── protected RPC / workspace SELECT
              ├─ offerOperationsRepository ── protected RPC / workspace SELECT
              └─ limited read projections (Audit, Integrations)

Vercel / local Node server
  └─ /api/{status,ai,orchestrate,provider,employee}
      ├─ verifiedOwnerContext
      ├─ Supabase server client
      ├─ Provider/OAuth runtime
      ├─ Cost Guard / reservation / ledger / circuit breaker
      └─ Provider adapters (live execution locked unless all gates pass)

Supabase PostgreSQL
  ├─ Auth + owner_profiles/workspaces/members
  ├─ Revenue/Approval/Evidence/Operations
  ├─ Cost/Provider/OAuth
  ├─ AI Employee/Google quota
  └─ RLS + protected RPC + audit
```

Dependency direction is UI → repository/domain → Supabase contract, and API → verified context → server runtime → Provider/Supabase. Browser credentials are limited to publishable Supabase identifiers.

## 9. Frontend Architecture

React 19.2.7, React DOM 19.2.7, Vite 8.1.3, React Router DOM 7.18.2, JavaScript/JSX and CSS. Auth Gate wraps router. App and all ten screens are lazy. Design System includes tokens, state registry, layout/typography primitives and reusable controls/cards/tables/states. Labs is fixture-only at `/labs/components`, requires successful Owner authentication and exact `VITE_DEVELOPER_MODE=true`, and otherwise returns 404. Mobile Drawer, Owner Menu, error boundary, loading skeletons and reduced motion exist. Browser support is modern evergreen browsers; exact production support matrix is UNKNOWN. UI Freeze status: **BLOCKED**, because authenticated browser evidence is missing.

Canonical routes: `/home`; `/employees[/...]`; `/approvals[/...]`; `/operations[/...]`; `/revenue[/actual|forecast|evidence|campaigns|records/:id]`; `/insights`; `/integrations[/:providerId]`; `/inbox`; `/audit`; `/settings`; guarded `/labs/components`. Root redirects to Home; legacy aliases redirect; unknown routes return 404.

## 10. UI / UX Specification

Brand: White/Warm White/Pearl with Champagne Gold; Silver, Soft Blue and Pale Purple are supporting accents. Deep Ink is primary text. Shared typography, 4–80px spacing scale, 10–26px radii, restrained shadows, 140–220ms motion, visible focus and 44px touch targets are tokenized. Page archetypes use large/medium/standard/compact Hero hierarchy and standard/wide/full widths. Japanese-first primary copy is required. Actual/Forecast/Mock/Unknown use explicit labels, not color alone.

Screens: Home=Owner command; Employees=role/work/permission; Approvals=decision queue; Operations=offer lifecycle; Revenue=truth/evidence/cost/profit; Insights=Actual readiness; Integrations=connection/permission/cost; Inbox=locked alternative; Audit=redacted trust record; Settings=read-only policy boundary. Base UI may only change for evidenced bugs/accessibility/responsive/contract/real-use issues; no new Design System or broad redesign.

## 11. Authentication and Session

The browser singleton uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Login calls `signInWithPassword({email,password})` exactly once with controlled values. Session restore and auth change are followed by active Owner profile verification with a 12-second fail-closed deadline. Logout uses existing `signOut`. UI shows safe environment labels only. Errors avoid enumeration; Caps Lock and password visibility exist. Password Recovery: **Not Implemented**. Password/token/session values are never documented, persisted or logged.

## 12. Database Architecture

Migrations 001–012 exist. 003–009 are protected history. 009 is OWNER-REPORTED applied on 2026-07-27. Remote state of 010–012 is **UNKNOWN**.

| Migration | Purpose | Main objects | Local status / remote |
| --- | --- | --- | --- |
| 001 | Revenue activation/sandbox usage | 4 tables, 3 RPCs, RLS | TESTED / UNKNOWN |
| 002 | Reusable reservations | replaces reservation RPC | TESTED / UNKNOWN |
| 003 | Production foundation | 18 tables, 5 functions, 18 RLS policies | TESTED / historical reported applied |
| 004 | Owner bootstrap access | grants/access corrections | TESTED / UNKNOWN |
| 005 | Revenue repository integration | candidate/evidence/integrity RPCs | TESTED / historical |
| 006 | Integrity trigger fix | safe cross-table trigger | TESTED / historical |
| 007 | Manual package | package/decision/retrieval/audit RPCs | TESTED / historical |
| 008 | Revenue MVP completion | Evidence/Actual/package corrections | TESTED / historical |
| 009 | Offer Operations | 7 tables, 8 RPCs, RLS | TESTED / OWNER-REPORTED applied |
| 010 | Provider Cost Guard | 6 tables, 3 RPCs | TESTED / UNKNOWN |
| 011 | Provider platform/OAuth | 5 tables, 2 RPCs | TESTED / UNKNOWN |
| 012 | AI Employee platform | 8 tables | TESTED / UNKNOWN |

Local verification reports 18/18 foundation tables; this is not proof of remote application.

## 13. Table Inventory

All 48 tables are enumerated with purpose and access path in the System Inventory. Common contract: UUID primary keys or declared composite keys; business tables carry workspace ownership; RLS is enabled where migration defines browser access; browser writes are denied or RPC-gated for Approval/Evidence/Actual/provider/AI domains. Exact columns, foreign keys, unique constraints and indexes remain authoritative in `supabase/migrations/*.sql`.

## 14. RPC and Repository Contracts

Canonical repositories:

- `createRevenueRepository`: workspace context/snapshot; candidate, decision, package, Evidence and Actual commands.
- `createOfferOperationsRepository`: offer/operation snapshot; register, prepare, decision, package access, performance, cost, learning and sanitized failure.

Protected RPC inventory is in the System Inventory. Commands derive workspace/Owner context, transact in PostgreSQL where defined, enforce idempotency/snapshot/version/Evidence rules and return safe failures. Direct browser mutation is prohibited for Approval decisions, Evidence verification, Actual Revenue, Provider cost/OAuth and AI runtime records. Two legacy repository helper inserts for `opportunities` and `campaigns` remain RLS-bound; do not expand this pattern.

## 15. Approval System

Approval requests bind target, scope, immutable preview/risk/decision snapshots, version/hash, expiry and workspace. `decide_approval` supports approve/reject/revise in current UI. One-time semantics prevent reuse; mismatch and expiry fail. Hold is **DEFERRED/ambiguous** because the unique decision model can leave a request pending without a safe later transition. No optimistic update. Approval never authorizes external execution by itself. Financial thresholds integrate with Cost Guard approval snapshots.

## 16. Evidence and Actual Revenue

Evidence records source type/reference, gross amount in minor units, cost, currency, occurrence date, note and sensitivity. Registration rejects invalid, duplicate or Forecast-as-Actual evidence. Owner verification creates/uses exact Approval state; Actual recording is protected and evidence-gated. Forecast/Mock/Test/pending values are excluded from Actual analytics. Unknown and verified zero remain distinct. Revenue and Insights use the canonical Revenue repository.

## 17. Provider Integration Platform

| Provider | Status | OAuth / credentials | Read/write/execution |
| --- | --- | --- | --- |
| Google | CONDITIONAL | OAuth; encrypted server storage | reads scope-gated; writes/external locked |
| Canva | CONDITIONAL | OAuth; encrypted server storage | contract present; Production use unverified |
| OpenAI | MOCK/CONDITIONAL sandbox | server API key | one allowlisted generation model; live Production not implemented |
| Anthropic | LOCKED | server API key | no allowlisted generation model |
| Gemini | CONDITIONAL health | server API key | health model only; generation locked |
| Perplexity | CONDITIONAL health | server API key | health model only; generation locked |

All use Owner/workspace verification, request classification, allowlists, Cost Guard, idempotency, bounded retry, circuit breaker, safe errors, audit/ledger and externalExecution=false defaults. Connection, scope, quota, health and remote environment are UNKNOWN until verified. Environment variable names are in Inventory; values excluded.

## 18. Google Operations AI Employee

Purpose: Google-service Operations assistant. Formal role/version: `google_operations`, 1.0.0, Conditional. Services: Gmail, Drive, Calendar, Analytics, Search Console and YouTube; capabilities/workflows are registry-defined. Current API endpoint accepts only `dryRun`, forces disconnected/no scopes, returns `googleApiRequests:0` and `externalExecution:false`. Task/activity/cost are Unknown unless real records exist; UI must not invent them. Quota ceiling, max records/duration, approval, scope, retry<=1, partial failure and handoff rules are implemented/tested. Production prompt/model/temperature/latency telemetry is not proven end-to-end; Prompt Hash is required for Production eligibility. Missing: authorized connection, verified scopes/quota, production task records and browser evidence.

## 19. AI Employee Platform

Registry currently contains Google Operations. Task contract requires workspace/Owner/employee/workflow/task/correlation/request class/capability/purpose/time/requester/parameters/scopes/classification/Approval/idempotency/Dry Run/ceilings/output type. Lifecycle transitions are explicit and cannot skip. Output records data freshness, sources, warnings, permissions, cost and externalExecution=false. Handoffs exclude raw sensitive content. Migrations 012 define employee, capability, task, event, handoff, Google binding and quota tables. A future employee must satisfy the Constitution contract before Production; missing Prompt Hash/model/metrics/evidence fails closed.

## 20. Cost Guard

Defaults: JPY; request/hour/day/month budgets; token and request limits; workflow/employee/workspace budgets; concurrency 1; batch and autonomous loops disabled; retry max 1. It checks global/provider flags, workspace, model allowlist, verified pricing, usage/ledger availability, reservations, threshold Approval (75% and 90% cases), circuit breaker and idempotency. Failures block dispatch. Migration 010 persists policy, allowlist, reservations, ledger, breakers and events. Remote enforcement is UNKNOWN until migration/environment verification.

## 21. Audit and Security

`audit_logs` is the canonical append-only business audit source. Package access, operation failure, provider execution/usage and employee events have domain audit evidence. Audit UI reads a limited workspace-scoped field set and validates/redacts summaries. Security controls include Owner/Auth verification, RLS, workspace checks, credential-free client payloads, server-only secrets, OAuth encryption/PKCE/state replay protection, CORS allowlist, Cost Guard and External Execution lock. Source policy, credential boundary/exposure and security suites pass. Known risks: React Router RSC advisory, remote environment UNKNOWN, authenticated browser blocked, and untracked `docs/audit.zip.zip` of unknown provenance.

## 22. API and Server Runtime

| Endpoint | Method | Auth / behavior |
| --- | --- | --- |
| `/api/status` | GET | safe local Mock status; no secret/external effect |
| `/api/ai` | POST | default local Mock; `sandboxGenerateRevenueLanes` requires verified Owner and gated OpenAI sandbox/usage store |
| `/api/orchestrate` | POST | Mock-only orchestration; real Provider/external flags blocked |
| `/api/provider` | POST | verified Owner/workspace; dryRun or Google/Canva OAuth begin/complete only |
| `/api/employee` | POST | verified Owner/workspace; Google employee dryRun only |

Local server routes POST API requests and Vite assets. Server runtime contains Supabase server client, verified context, OAuth cipher/transport/runtime, Provider gateway/adapters and usage stores. Errors are normalized; secrets/raw Provider errors are excluded. Deployment runtime is Vercel-style serverless; actual deployment is UNKNOWN.

## 23. Environment Variables

Client/build: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, optional exact `VITE_DEVELOPER_MODE`. Server core: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `KEVIRIO_ALLOWED_ORIGIN`. Provider secrets: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `PERPLEXITY_API_KEY`, Google/Canva client IDs/secrets. Execution flags: global and per Provider plus OpenAI sandbox. OAuth: encryption key, redirect base, Google/Canva enable flags. Google read flags and property/site/channel IDs are server-only. Budget/token variables configure Cost Guard. Basic Auth names exist in example configuration but runtime usage requires verification. Missing required values fail closed. No values were read or recorded.

## 24. Development Environment

Observed Windows/PowerShell, Node v24.18.0, npm 11.16.0. Commands:

```powershell
npm ci
npm run dev
npm run dev:full
npm run build
npm run typecheck
npm run test:unit
npm run test:integration
npm run test:e2e
npm run lint
npm run verify:security
npm run verify:migrations
npm run audit:env
npm run audit:providers
npm run verify:cost-guard
npm run verify:provider-platform
npm run verify:ai-employees
```

Vite default uses port 5173 unless overridden; local full server source defaults are authoritative. LAN exposure occurs with `--host 0.0.0.0`; do not expose secrets. Common issues: missing env, unlinked Vercel, unknown remote migration, Browser ACL failure.

## 25. Package and Dependency Inventory

Runtime: Supabase 2.110.7, lucide-react 1.23.0, React/React DOM 19.2.7, React Router DOM 7.18.2. Dev: Vite 8.1.3, React plugin 6.0.3. `npm ls --depth=0` passes. `npm audit --omit=dev` reports two High findings for React Router RSC Mode CSRF. Current app is a BrowserRouter Vite SPA with no RSC routes; Owner classified this as Known Risk, not commit blocker. Automatic downgrade is breaking and not authorized. Dedupe dry-run produced no evidenced required change.

## 26. Build and Bundle

Latest verified build: Vite 8.1.3, 1,888 modules; initial JS 448.84 kB raw / 130.60 kB gzip; initial CSS 43.07/8.98 kB; total CSS 91.20 kB; 17 JS chunks; largest 448.84 kB; no >500 kB chunk. Labs and screens are lazy. Historical RC1 initial was 444.85/129.04 kB before later V2/Closure CSS/UI changes. Current performance is acceptable at initial bundle gate; total CSS growth is documented and authenticated layout-shift/browser evidence is blocked.

## 27. Test Architecture

26 Unit files cover domain, Auth, Provider, Cost Guard, OAuth, AI Employee, UI/design contracts and governance. 16 Integration files cover migrations, repositories, routing, Provider/AI platforms and workspace. Two E2E files cover canonical offer/revenue acceptance. Scripts cover syntax, source policy, credential boundaries/exposure, migrations, environment, Provider diagnostics and legacy vertical slices. Current test counts/results are in Validation Evidence. Browser-specific visual/keyboard/network checks remain BLOCKED.

## 28. Current Validation Status

See [Validation Evidence](docs/handover/KEVIRIO_VALIDATION_EVIDENCE.md). Current verified results: syntax 184/184; Unit 164/164; Integration 85/85; E2E 2/2; source policy 273 files; credential boundary 27/27; credential exposure 20/20; migration foundation 18/18; build PASS; diff check PASS; dependency audit two High known-risk findings. Browser BLOCKED.

## 29. Git and Release State

Remote `origin=https://github.com/nexora-ai-os/kevirio-os.git`; branch tracks the matching origin branch; HEAD is pushed commit 4837c81. Working tree is dirty with Owner UI/governance work and these handover docs. Staged: None. No new commit/push/deploy/tag/release/merge was performed in this audit. `docs/audit.zip.zip` is untracked, unreferenced in repository search, provenance UNKNOWN, intentionally excluded and untouched.

## 30. Deployment Architecture

`vercel.json` preserves filesystem then rewrites all paths to `/index.html` for SPA deep links. Local Vercel project link is absent. Preview/Production env inventories, custom domain, cache headers, Supabase target, remote migrations 010–012 and OAuth callback registration are UNKNOWN. Rollback docs exist. Required release sequence: Code Validation → Commit → Push → Preview env → Preview deploy → authenticated Browser → Production decision.

## 31. Operational Runbook

1. Login as active Owner.
2. Register a real Offer with source/reference.
3. Prepare Operation; review Intelligence/Strategy/Content.
4. Decide exact Approval snapshot.
5. Open/copy/download Manual Package.
6. Owner manually publishes externally.
7. Record performance and Actual cost with references.
8. Register Evidence in Revenue.
9. Approve/verify and record Actual Revenue.
10. Confirm Actual-only Revenue/Insights.
11. Review Provider readiness and Audit.
12. On error, stop, record safe reason, retry only where contract permits.
13. Logout.

## 32. Failure Modes and Recovery

| Failure | Safe diagnosis / recovery | Unsafe action |
| --- | --- | --- |
| Login/invalid credentials | verify email/Caps Lock/password manager, one retry, sanitized code | request/log password |
| Supabase/RLS/repository/RPC | confirm env presence, active Owner/workspace, remote migration; retry read safely | bypass RLS/direct protected write |
| Audit read | confirm workspace/read availability; no data mutation occurs | fabricate success |
| Provider/OAuth | check enable flag, redirect allowlist, scope, encrypted state, quota | expose token or skip state/PKCE |
| Quota/Cost Guard | inspect safe reason, budget, pricing, ledger, circuit | raise limits or enable execution silently |
| Approval expired/mismatch | create fresh exact request/snapshot | reuse/modify Approval |
| Evidence invalid | correct reference/minor units/currency/date | record Forecast as Actual |
| External execution locked | use Manual Package/human action | toggle/bypass lock |
| Build/Test | reproduce exact command, inspect diff | skip/delete test |
| Browser sandbox | restore browser runtime/Owner Session | bypass Auth |
| Vercel env missing | configure names/presence in Preview | print values |
| Migration UNKNOWN | authorized remote inventory/read | assume applied/apply without approval |

## 33. Known Limitations

Inbox backend; Settings mutation; Password Recovery; External Execution; Google Operations live execution; proven Provider production connection; remote 010–012 state; Browser automation; Approval Hold; multi-user/admin/staff model; AI Employee production operations; deployment/Preview evidence; Audit export/search/pagination; complete production telemetry proof are absent, locked, unknown or deferred.

## 34. Open Items

Canonical list: [Open Items and Decisions](docs/handover/KEVIRIO_OPEN_ITEMS_AND_DECISIONS.md). Critical path is remote state → Preview environment → authenticated browser → first real Offer/manual workflow/Evidence/Actual.

## 35. Decisions Already Fixed

AI Company OS identity; Owner authority; Profit First; first-sale target; External Execution locked; Google Dry Run; Manual Execution; Evidence-gated Actual; UI Freeze; White/Champagne/Silver/Blue/Purple brand; Japanese-first; migration history protection; exact versions; maturity labels; Provider security; AI Employee contract; separate commit/push/deploy approvals; no broad UI redesign.

## 36. Decisions Still Needed

Only: whether/when to verify/apply missing remote migrations; Preview environment authorization; Provider/OAuth activation scope; acceptance of authenticated UI evidence; first real Offer selection; whether Approval Hold needs a new formal contract. No other Owner decision is inferred.

## 37. Recommended Development Sequence

1. **Current remote verification** — precondition: authorized read access; inspect migration/env/provider presence; no writes; exit with evidence.
2. **Preview environment** — configure names/presence and callbacks; deploy only with approval; rollback via prior deployment.
3. **Authenticated Browser gate** — all routes/viewports/console/network; exit with screenshot package.
4. **Google OAuth/Operations readiness** — smallest read-only scope first; Cost Guard and Audit tests; no write.
5. **First real Offer workflow** — register, approve, manual package, human publish, Evidence, Actual, Insights and cost/audit review.

Each phase requires relevant existing suites and explicit Owner approval for deploy/OAuth/migration/external changes. No UI redesign.

## 38. Immediate Restart Point

**Perform an authorized, read-only remote state verification for Supabase migration versions 010–012 and Preview environment variable presence (names only), then record results without applying migrations or deploying.**

## 39. Do Not Touch List

Migrations 003–009; Auth/signIn/session/Owner verification; RLS; protected RPC grants; repository boundaries; Approval snapshot/version/expiry/one-time semantics; Evidence/Actual rules; Cost Guard; Provider credential encryption/gateway; Workspace derivation; Audit append-only/redaction; External Execution lock; Google Dry Run; Mock/Forecast/Actual separation; UI tokens/base system during freeze; `docs/audit.zip.zip`.

## 40. Questions for Owner

1. Authorize read-only remote verification of migrations 010–012?
2. Authorize/configure a Preview environment after reviewing current dirty worktree scope?
3. Which Provider, if any, may enter read-only OAuth validation first: Google or Canva?
4. Which real Offer is approved for the first governed workflow?
5. Should Approval Hold remain deferred or receive a separate formal database/business contract?

## 41. Design Knowledge Integration

- Read [Architecture Decision Records](docs/architecture/KEVIRIO_ARCHITECTURE_DECISION_RECORDS.md) after the Constitution to understand why boundaries exist.
- Read the [KEVIRIO Glossary](docs/governance/KEVIRIO_GLOSSARY.md) whenever a business, maturity, approval, evidence, provider, AI Employee or UI term is ambiguous.
- Reading order: Constitution → ADR → Architecture Baseline → Glossary → Runbook → Current Master Handover → Development Restart Prompt.
- A `PROPOSED` ADR is not Owner-approved. Implementation and formal approval are separate.
- If ADR/Glossary and implementation conflict, record the Conflict, preserve Production behavior and request Owner decision; do not silently reconcile it.

## 42. V1 Emergency Completion Addendum — 2026-08-03

- Migration 012 Production activation is Owner-confirmed: pre-check PASS, migration SUCCESS, corrected read-only smoke PASS. It was not re-run.
- Migration 013 is a local unapplied release candidate with SHA-256 4007CCD98104A67F1BE7061E8D450A8DED699A388FDBC9DE4211C1A05EB01D8C.
- The V1 UI/contract increment adds a truthful ten-item Owner Control Plane, an exact-evidence 21-stage Company Operating Cycle, twelve cycle statuses, six Revenue Engine definitions, and the affiliate Manual Execution Package presentation/contract.
- Authenticated Windows-native Browser Validation is current: 104/104 PASS across ten Production routes and all required responsive/accessibility/Data Truth gates.
- Current automated gate: Build PASS; Unit 180/180; Integration 97/97; E2E 3/3; Migration 013 static/contract 13/13 PASS; security and credential gates PASS.
- Current decision: **CONDITIONAL GO — OWNER ACTION ONLY**. The sole V1 activation gate is Owner execution of the fixed Migration 013 pre-check, one-time migration, and read-only post-apply smoke.
- Canonical execution instructions: docs/validation/MIGRATION_013_OWNER_ACTIVATION_PACKAGE.md.
- No commit, push, deployment, OAuth authorization, Provider execution, External Execution unlock, or Production mutation was performed by this completion pass.
