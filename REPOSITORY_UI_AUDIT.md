# KEVIRIO Repository UI Audit — RC1

監査日: 2026-07-29  
対象: 現在のワークツリー（既存の未コミット変更を含む）  
仕様: `KEVIRIO_UI_UX_RELEASE_CANDIDATE_RC1/` 内の全4ファイル  
判定語: `VERIFIED` = 実行確認済み、`SUPPORTED BY CODE REVIEW` = コード確認済み、`UNVERIFIED` = 実環境未確認、`BLOCKED` = 前提不足

## 1. Executive finding

KEVIRIOの認証、Workspace、Approval、Evidence、Actual Revenue、Audit、Cost Guard、Provider credential境界は、UIより成熟している。UI移行はこれらを置換せず、既存repository/RPCの上に新しいrouting、shell、semantic state、Production/Labs分離を段階的に構築すべきである。

現状とRC1の最大差分は以下。

1. URL routerがなく、全画面が`/`上のReact stateで切り替わる。
2. Production画面とlocalStorage/Mock Labsが同一Sidebarに混在する。
3. `src/App.jsx`が27件以上のlocalStorage stateと全画面importを保持し、初期bundleへ集約する。
4. global CSSが大きく、RC1 semantic tokenと現行mint/glass visualが競合する。
5. shared primitives、modal focus管理、responsive navigationが不足する。
6. 仕様パッケージ自身の日本語canonical copyにもmojibakeが含まれる。英語で定義された意味は採用できるが、破損したcopyはProduction文言のsource of truthとして直接使用できない。

## 2. Specification integrity and conflicts

Manifest記載の3文書はSHA-256が一致した。Manifest自身も全文確認済み。

| Concern | Finding | Status |
|---|---|---|
| Package completeness | Master Spec 2,839行、Implementation Prompt 1,043行、Handoff 74行、Manifest 26行を末尾まで確認 | VERIFIED |
| Source hierarchy | Constitution → production architecture/DB → RC1 spec → repositories/services/tests → legacy UI | SUPPORTED BY CODE REVIEW |
| Filename mismatch | Promptは`KEVIRIO_UI_UX_MASTER_SPEC_v1.md`を参照するが、実在ファイルは`...v1.0_RC1.md` | Conflict;実在するRC1を採用 |
| Audit output path | User directiveはroot、Promptは`docs/ui/`を指定 | Conflict;明示指示どおりrootに作成 |
| Japanese canonical copy | RC1文書にも判読不能な破損文字列が存在 | BLOCKED for verbatim copy |
| Router dependency | `react-router-dom`追加にはOwner acceptanceが必要 | UNVERIFIED decision |

## 3. Current architecture

```text
Browser
└─ src/main.jsx
   └─ SupabaseOwnerAuthGate
      ├─ Supabase Auth session
      ├─ owner_profiles role/status check
      └─ src/App.jsx
         ├─ page state navigation (no URL router)
         ├─ canonical Production screens
         │  └─ repositories → Supabase SELECT / protected RPC
         ├─ Provider/Employee readiness screens
         │  └─ Supabase read + serverless APIs
         └─ legacy/Mock screens
            └─ React state + localStorage

Serverless API
├─ verifiedOwnerContext
├─ provider/cost/egress gateways
├─ encrypted OAuth runtime
└─ Supabase service-role boundary

Supabase PostgreSQL
├─ migrations 001–009: revenue/approval/evidence/operations
├─ migration 010: provider cost guard
├─ migration 011: provider/OAuth platform
└─ migration 012: AI employee platform
```

### Exact primary paths

- Entry: `src/main.jsx`
- Auth: `src/components/SupabaseOwnerAuthGate.jsx`
- App/navigation state: `src/App.jsx`
- Sidebar: `src/components/Sidebar.jsx`
- Global CSS: `src/styles.css`
- Revenue repository: `src/repositories/revenueRepository.js`
- Offer operations repository: `src/repositories/offerOperationsRepository.js`
- Supabase browser client: `src/services/supabaseBrowserClient.js`
- Workspace bootstrap: `src/services/workspaceBootstrapService.js`
- Provider API: `api/provider.js`
- Employee API: `api/employee.js`
- Cost Guard: `src/services/providerCostGuard.js`
- Migrations: `supabase/migrations/001_...` through `012_...`

## 4. Production data flow

```text
Verified Owner session
→ inspectOwnerWorkspace()
→ active owner membership + brand
→ createRevenueRepository()/createOfferOperationsRepository()
→ workspace-scoped SELECT
→ protected RPC for mutation
→ RLS + SQL integrity constraints
→ canonical reload
→ UI
```

`CanonicalHome`, `ProductionRevenueWorkspace`, `OfferOperationsWorkspace`, and canonical `Analytics` are the production UI roots. Server truth is not copied into localStorage by these repositories.

## 5. Approval data flow

```text
artifact/candidate
→ approval_requests.preview_snapshot + hash/version
→ repository.decideApproval()
→ decide_approval protected RPC
→ expiry/workspace/snapshot/version validation
→ immutable approval_decisions
→ optional generate_manual_execution_package
→ external execution remains false
```

Primary `/approval` state currently renders `ProductionRevenueWorkspace`; legacy `ApprovalCenter` exists but is not the primary approval route. This invariant must remain.

## 6. Evidence-to-Actual flow

```text
Manual external result
→ registerEvidence()
→ register_revenue_evidence RPC
→ evidence_candidate / immutable preview
→ Owner approval
→ verify_evidence_and_record_revenue RPC
→ revenue_records
→ canonical analytics/overview
```

- Forecast does not enter `revenue_records`.
- Unknown revenue is not treated as zero by canonical overview tests.
- Actual requires verified evidence and Owner scope `actual_revenue_verification`.

## 7. Provider connection and permission flow

```text
Owner + workspace verification
→ /api/provider
→ OAuth intent (state hash + PKCE + 10-minute expiry)
→ encrypted token storage (AES-256-GCM)
→ independent connection/scopes/capabilities/health state
→ Provider Platform Gateway
→ Cost Guard + egress + approval + circuit breaker
→ external dispatch (currently structurally locked)
```

Connection, scope, permission, global lock, provider lock, quota and cost are separate fields. `ProviderHub` currently exposes a reduced read-only projection; it does not establish write permission.

## 8. AI Employee execution flow

```text
POST /api/employee, action=dryRun
→ verified Owner/workspace
→ createEmployeeTask(dryRun=true)
→ Google capability/scope/quota evaluation
→ dry-run result
→ 0 Google API / 0 AI provider / 0 write / 0 send / 0 publish
```

Formal registry currently contains only `google_operations`, version `1.0.0`, maturity `Conditional`. Legacy Revenue/Trend/Content/Design employees are Mock/Planned.

## 9. Route and navigation inventory

URL routing: `None`。`page` state only; refresh, deep link, history, 404 are not implemented.

| Current key | Current component | Classification | RC1 target |
|---|---|---|---|
| home | CanonicalHome | Production | `/home` |
| production | ProductionRevenueWorkspace | Production | `/revenue` |
| approval | ProductionRevenueWorkspace | Production alias | `/approvals` |
| campaign | OfferOperationsWorkspace | Production | `/operations/offers` |
| operations | OfferOperationsWorkspace | Production alias | `/operations` |
| analytics | Analytics | Conditional | `/insights` |
| providerHub | ProviderHub | Conditional/Locked | `/integrations` |
| googleOperations | GoogleOperationsEmployee | Dry Run/Locked | `/employees/google_operations` |
| apiCenter | APIControlCenter | Mixed readiness/Mock | split to Integrations/Labs |
| review | OwnerReviewWorkspace | Mock/Sandbox | `/labs/review` |
| ceo, memory, opportunity, trends | legacy components | Mock/localStorage | `/labs/*` |
| workflows, dashboard, workEngine, work | legacy components | Mock/localStorage | Labs or selective productionization |
| affiliate, content, assistant | legacy components | Mock Lab | `/labs/*` |
| settings | Settings | local UI settings | `/settings` |

Current Sidebar has 22 destinations; RC1 production navigation requires exactly seven plus utility destinations.

## 10. Component and hook inventory

- JSX files: 49 total; top-level component files: 45.
- Shared primitives: `PageContainer`, `SectionTitle`, `GlassPanel`, `StatusBadge`, `Button`, `Card`, `Loading`, `EmptyState`, `MotionBackground`.
- Hooks: `useLocalStorage`; `useAdaptiveData` is stored under components/shared.
- Missing RC1 primitives include EnvironmentBadge, complete form controls, accessible Modal, Drawer, Toast, Table, Timeline, Money, PageHeader and normalized error views.
- `BudgetGuardModal` has dialog semantics but no verified focus trap, return focus or scroll lock.

## 11. Browser-side mutation inventory

### Canonical production

- `revenueRepository.js`: direct inserts for `opportunities`/`campaigns` remain present but primary critical mutations use RPCs.
- RPCs: bootstrap workspace, create revenue candidate, decide approval, package generation/access audit, evidence registration/verification, offer registration/preparation, performance/cost/learning, operation failure.
- Clipboard/download actions record package access through RPC where canonical packages are involved.

### Provider UI

- Browser reads connection metadata only.
- OAuth exchange and token persistence occur server-side.

### Mock/local UI

- At least 27 `useLocalStorage` states in `App.jsx`.
- Additional pending AI message handoff uses `kevirio-pending-ai-message`.
- Mock review/revision/revenue activation services use explicitly namespaced localStorage workspaces.
- Current `resetAll` removes only a subset of created keys; it must not be labelled a complete reset.

## 12. Repository/service layer

### Revenue repository

Canonical reads: opportunities, campaigns, tasks, artifacts, approval requests, evidence, revenue records, workflow runs, execution packages.  
Canonical commands: `create_revenue_candidate`, `decide_approval`, `generate_manual_execution_package`, `record_manual_package_access`, `register_revenue_evidence`, `verify_evidence_and_record_revenue`.

### Offer repository

Canonical reads: offers, operations, connections, performance, costs, learnings, failures, approvals, packages, revenue.  
Canonical commands: register offer, prepare operation, approve exact snapshot, package access, performance, cost, learning and sanitized failure.

### Risk

Repository functions and some production JSX are one-line/minified style and contain user-copy encoding defects. Formatting/refactoring must be behavior-preserving and isolated from domain changes.

## 13. Supabase, Workspace and RLS

- Supabase Auth email/password Owner gate: SUPPORTED BY CODE REVIEW.
- Active `owner_profiles` verification: SUPPORTED BY CODE REVIEW.
- Active workspace membership and brand verification: SUPPORTED BY CODE REVIEW.
- All UI-relevant business tables have RLS coverage tests.
- Revenue/operation browser tables are SELECT-oriented after migrations 006/009; protected changes use authenticated RPCs.
- Provider cost/OAuth/AI employee mutations are service-role restricted in 010–012.
- Live remote migration level and deployed policies: UNVERIFIED.

## 14. Audit logging

- Canonical audit tables/events exist.
- Package view/copy/download is audited.
- Operation command failures record sanitized context.
- Provider usage ledger stores hashes/usage, not prompt or credential values.
- Provider execution events and employee task events exist.
- A complete production Audit route/UI is Not Implemented.

## 15. Cost Guard

The runtime enforces global/provider switches, model allowlist, verified pricing, token limits, per-request/hour/day/month/workflow/employee/workspace budgets, concurrency=1, retry rules, one-time approval, usage/ledger availability and circuit breaker. Batch and autonomous loop are disabled. Tests confirm fail-closed behavior.

## 16. CSS architecture

- CSS files: 5; total source CSS 62,111 bytes.
- `src/styles.css`: global entry, approximately 1,800 lines.
- Additional scoped-by-class but globally imported CSS: Market Intelligence, Production Readiness, Provider Hub, Google Operations.
- Current palette is mint/sky/glass; RC1 requires restrained neutral/gold semantic tokens.
- Arbitrary radii/colors/shadows are widespread.
- Continuous decorative orb animation conflicts with RC1 production rules.
- `prefers-reduced-motion` is absent.
- Focus-visible coverage is partial.

## 17. Bundle baseline

Production build result:

| Asset | Raw | Gzip |
|---|---:|---:|
| JS | 916.51 kB | 254.72 kB |
| CSS | 49.85 kB | 9.72 kB |
| HTML | 0.47 kB | 0.31 kB |

There is one JS chunk and one CSS chunk. Vite emits the >500 kB warning. Gzip initial JS is below the RC1 350 kB compressed target, but route-level splitting and per-route chunk targets are not satisfied. All legacy/Labs modules are synchronously imported.

## 18. Baseline verification

| Gate | Result |
|---|---|
| `npm run build` | VERIFIED; success with chunk warning |
| Unit tests | VERIFIED; 108/108 |
| Integration tests | VERIFIED; 80/80 |
| E2E tests | VERIFIED; 2/2 |
| Source policy | VERIFIED; 232 files |
| JS syntax | VERIFIED; 170/170 |
| Credential boundary | VERIFIED; 27/27 |
| Credential exposure | VERIFIED; 20/20 |
| Migration foundation | VERIFIED; 18/18 tables |
| Browser console | UNVERIFIED; authenticated local runtime not available in audit |
| Screenshot baseline | BLOCKED; valid Owner session/remote environment not established |

## 19. Technical debt and risks

| Risk | Severity | Response |
|---|---|---|
| Route/state rewrite could disconnect canonical repositories | Critical | Route wrappers only; no repository replacement |
| Production/Labs state collision | High | Lazy Labs namespace and explicit environment adapter |
| Mojibake in app and RC1 copy | High | Inventory/test first; Owner-reviewed Japanese copy before replacement |
| Existing dirty worktree | High | Small additive files; avoid unrelated edits |
| App-level state concentration | High | Move state only with owning feature, phase by phase |
| Global CSS regression | High | Add tokens/base with scoped adoption; do not bulk replace |
| Alias removal may break existing internal `setPage` calls | Medium | Compatibility redirects/adapters during migration |
| Router dependency decision unresolved | Medium | ADR/Owner decision before dependency install |
| Live migrations/OAuth/provider deployment unknown | Critical operational | Never label connected/Production without runtime evidence |
| Spec copy is itself corrupted | Critical content | Do not copy broken strings into production |

## 20. Specification gaps and Owner decisions

1. Router choice: approve `react-router-dom` or require a minimal native router.
2. Japanese canonical copy: a clean UTF-8 copy catalogue is required before final Production copy migration.
3. Screenshot baseline: authenticated local/preview environment and test Owner access are required.
4. Live Supabase migration version 010–012 is UNVERIFIED.
5. Current deployment/OAuth/provider credential state is UNVERIFIED.
6. No formal employee creation contract exists; Employees v1 must remain registry/read-only.
7. Inbox canonical aggregation contract is not implemented.
8. Audit route query/pagination contract is not implemented.
9. Workspace switching is not implemented; current app assumes the single Owner workspace.

## 21. Recommended migration strategy

1. Freeze and continuously test architecture invariants.
2. Decide router through an ADR; introduce URL routes as compatibility wrappers.
3. Add tokens and semantic state adapters without altering repositories.
4. Add accessible primitives and use them first on new shell surfaces.
5. Establish seven-item production navigation and guarded lazy Labs.
6. Migrate Home/Approvals, then Revenue/Operations, because these carry the most important truth semantics.
7. Implement Employees/Integrations only from formal registry/provider projections.
8. Add Inbox/Audit/Settings only after their canonical view models are explicit.
9. Finish with mojibake, accessibility, visual regression, bundle and security hardening.

No architecture stop condition is required for Phase 0. Phase 1 cannot select/install a router until the router decision is recorded.

## 22. Post-implementation audit update — 2026-07-30

- The authenticated route architecture is now `SupabaseOwnerAuthGate -> AppRouter -> lazy App -> ApplicationShell -> lazy screen`.
- Production navigation is exactly Home, AI Employees, Approvals, Operations, Revenue, Insights and Integrations, plus Inbox, Audit and Settings utilities. Labs is not displayed.
- All ten Production destinations are screen-level lazy modules. Legacy Mock/localStorage modules are no longer imported by `App.jsx`.
- Revenue and Insights retain the existing Revenue and Offer Operations repositories and do not synthesize Actual values or new calculations.
- Integrations is a read-only projection of existing provider definitions/connections. It selects no credential values and keeps External Execution locked.
- Inbox has no canonical repository or data source and therefore renders a truthful empty/not-connected state. No Production activity is fabricated.
- Audit uses existing `audit_logs`, requires exactly one active Owner workspace membership, selects a restricted field set, validates credential-free summaries and redacts unsafe values. No Audit mutation was added.
- Settings exposes only existing, truthful boundaries. Unsupported workspace/settings changes are marked Not Implemented and have no working controls.
- Approval `revise` and `reject` use the existing exact-snapshot `decideApproval` command without optimistic mutation. `hold` is deferred because migration behavior leaves the request pending while the unique decision record prevents an unambiguous later decision.
- No database, migration, RLS, repository contract, protected RPC, authentication, Workspace, Evidence, Actual Revenue, Cost Guard, Provider gateway or external-execution behavior changed in this UI batch.
- Final automated verification: 145 unit, 85 integration and 2 E2E tests passed; syntax 182/182; source policy 270 files; credential boundary 27/27; credential exposure 20/20; migration foundation 18/18.
- Final build: 17 JS chunks, 589.94 kB raw / 178.12 kB gzip total; initial 444.85 kB raw / 129.04 kB gzip; largest chunk 444.85 kB raw; CSS 59.57 kB raw / 13.42 kB gzip across five assets.
- Authenticated browser screenshots, browser console, visual reflow and live focus traversal remain **BLOCKED** by Owner directive.
