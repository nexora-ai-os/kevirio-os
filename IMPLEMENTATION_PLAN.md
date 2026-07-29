# KEVIRIO UI/UX RC1 Implementation Plan

## Completion status — 2026-07-30

- Phase 0–4: Complete and Owner approved.
- Combined Phase 5–8: Complete and Owner approved.
- Final combined Production batch: Complete for all safe, authorized RC1 work. Revenue, Insights, Integrations, Inbox, Audit and Settings now use the Production Shell and Design System.
- Phase 9 objective: Complete. Legacy Mock/localStorage screens are absent from the Production application graph; Labs remains a separate lazy fixture-only route guarded by Owner authentication and `VITE_DEVELOPER_MODE=true`.
- Phase 10 code-level objective: Complete. Full automated verification passes, canonical Production source has no detected mojibake, every Production screen is lazy, and no chunk exceeds 500 kB raw.
- Browser-only visual, authenticated console, focus traversal and reflow verification: **BLOCKED** by Owner directive. No workaround attempted.
- Deferred by explicit stop conditions: Approval `hold`; Inbox backend; Settings mutations; Audit export/search/pagination; AI Employee URL filters/detail tabs; Drawer and Toast. These require missing or ambiguous contracts and were not invented.

This plan is intentionally incremental. Every phase is independently reviewable and stops for Owner approval before the next phase.

## Phase 0 — Baseline and Guardrails

**Goal:** Establish reproducible evidence without changing runtime behavior.  
**Files affected:** `REPOSITORY_UI_AUDIT.md`, `IMPLEMENTATION_PLAN.md`, `docs/ui/UI_IMPLEMENTATION_LOG.md`.  
**Estimated risk:** Low. Documentation-only.  
**Rollback:** Remove the three new documents.  
**Acceptance criteria:** Full RC1 read, integrity verified, repository/data-flow/routes/Mock inventory recorded, build/tests/security/bundle baseline recorded, unresolved decisions explicit.  
**Tests:** build, unit, integration, E2E, lint/source policy, syntax, credential boundary/exposure, migration verification.

## Phase 1 — Router Foundation and Compatibility Routes

**Goal:** Add protected URL routing, redirects, history/deep-link support, lazy route boundaries and 404 without changing canonical screen behavior.  
**Files affected:** `package.json` only if router approved; `src/main.jsx`; new `src/app/*`; thin compatibility wrappers; route tests; ADR.  
**Estimated risk:** High—entry point and navigation behavior.  
**Rollback:** Restore `src/main.jsx` entry and current `App.jsx`; remove additive app/router files and dependency.  
**Acceptance criteria:** `/`→`/home`; target routes resolve; Owner gate remains outer boundary; legacy views remain reachable; history/refresh/404 pass; no repository changes; initial lazy chunks emitted.  
**Tests:** existing full suite; auth-protected routes; deep link, history, unknown route; bundle report; credential scan.

## Phase 2 — Tokens and Semantic State Foundation

**Goal:** Add RC1 tokens, base styles, semantic state/environment registry and formatters without globally restyling Labs.  
**Files affected:** new `src/design-system/tokens.css`, `base.css`, semantic registry/formatters and unit tests; scoped imports in app shell.  
**Estimated risk:** Medium—CSS cascade and semantic mapping.  
**Rollback:** Remove new stylesheet imports and registry consumers.  
**Acceptance criteria:** all canonical UI states centrally mapped; unknown/zero, Actual/Forecast and environment mappings tested; reduced-motion baseline exists; no legacy visual regression.  
**Tests:** registry/token/formatter unit tests, build, full suite, visual smoke.

## Phase 3 — Shared Accessible Components

**Goal:** Implement only primitives required by the first canonical routes.  
**Files affected:** `src/design-system/primitives/*`, `components/*`, `patterns/*`, component tests, Labs component preview.  
**Estimated risk:** Medium.  
**Rollback:** Retain existing components and remove consumers incrementally.  
**Acceptance criteria:** Button, Card, Badge, EnvironmentBadge, FormField/controls, Empty/Error/Loading, Modal, PageHeader, Money and OwnerActionItem meet contracts; focus/reduced motion/disabled reason pass.  
**Tests:** interaction, keyboard, modal focus/return, semantic markup, unknown/zero, accessibility checks.

## Phase 4 — Application Shell and Production/Labs Separation

**Goal:** Introduce seven-item production navigation, utility navigation, responsive shell and Developer Mode guarded Labs.  
**Files affected:** `src/app/shell/*`, navigation config, settings preference adapter, Labs route/layout, legacy `Sidebar.jsx` compatibility layer.  
**Estimated risk:** High—discoverability and legacy navigation.  
**Rollback:** Route shell feature flag returns to compatibility shell.  
**Acceptance criteria:** seven production items only; Labs hidden by default and lazy; desktop/tablet/mobile navigation; environment/workspace always visible; Developer Mode affects UI visibility only.  
**Tests:** navigation matrix, Labs guard, responsive/keyboard smoke, bundle composition, existing suite.

## Phase 5 — Home and Approvals

**Goal:** Implement the Owner decision surface on canonical repositories while preserving exact approval behavior.  
**Files affected:** `src/features/home/*`, `src/features/approvals/*`, view-model adapters, route tests; existing repositories unchanged except proven additive read projection needs.  
**Estimated risk:** Critical—approval semantics.  
**Rollback:** Route back to `CanonicalHome` and `ProductionRevenueWorkspace`.  
**Acceptance criteria:** deterministic brief; max five actions; unknown not zero; exact snapshot/version/hash/expiry/effect; no optimistic approval; external execution remains false.  
**Tests:** canonical Home, approval snapshot, expiry/use/mismatch, external lock, workspace boundary, E2E Owner action flow.

## Phase 6 — Revenue and Operations

**Goal:** Separate Actual, Forecast, Evidence, Campaigns and Packages; expose bounded operation steps through existing repositories.  
**Files affected:** `src/features/revenue/*`, `src/features/operations/*`, adapters and tests; canonical repository APIs preserved.  
**Estimated risk:** Critical—financial truth and evidence.  
**Rollback:** Route back to current production workspaces; no DB rollback required.  
**Acceptance criteria:** evidence-gated Actual; unknown/verified-zero distinction; package is not delivery; forecast persistent label; finite workflow steps; package access audit preserved.  
**Tests:** revenue/evidence/state-machine suites, package audit, operation repository, cross-workspace block, critical E2E.

## Phase 7 — AI Employees and Integrations

**Goal:** Present formal employee and provider state contracts without implying execution readiness.  
**Files affected:** `src/features/employees/*`, `src/features/integrations/*`, UI adapters/tests; existing gateways unchanged.  
**Estimated risk:** High—permission and credential semantics.  
**Rollback:** Route back to current ProviderHub/GoogleOperationsEmployee.  
**Acceptance criteria:** only formal registry can be Production/Conditional; Google remains Dry Run; connection/auth/read/write/approval/global lock/provider lock/quota/cost/health shown independently; no credentials.  
**Tests:** employee lifecycle/dry run, provider ladder, OAuth projection, Cost Guard, credential scans, zero external request assertions.

## Phase 8 — Insights, Inbox, Audit and Settings

**Goal:** Add remaining utility/analysis routes from canonical, redacted view models.  
**Files affected:** `src/features/insights/*`, `inbox/*`, `audit/*`, `settings/*`, pagination/filter adapters and tests.  
**Estimated risk:** High—aggregation, redaction and reset scope.  
**Rollback:** Disable individual routes and restore compatibility Settings/Analytics.  
**Acceptance criteria:** Actual/Forecast separated; Inbox read≠resolved; Audit redacted and searchable; reset wording exactly matches deletion scope; no invented organization/member mutation.  
**Tests:** source-state mapping, redaction, correlation filtering, reset-scope unit test, route integration.

## Phase 9 — Labs Migration and Initial Bundle Isolation

**Goal:** Move all localStorage/Mock views under guarded `/labs/*` and remove their synchronous production imports.  
**Files affected:** Labs route registry/wrappers, legacy App state extraction, localStorage namespaces, tests.  
**Estimated risk:** High—large legacy dependency graph.  
**Rollback:** Restore compatibility imports behind existing feature flag; preserve stored keys.  
**Acceptance criteria:** Mock never contributes to canonical KPI/action queue; Labs banner/source visible; Labs absent when Developer Mode off; Labs excluded from initial bundle.  
**Tests:** Production/Mock isolation, stored-data compatibility, lazy chunk assertions, full E2E.

## Phase 10 — Accessibility, Copy and Performance Hardening

**Goal:** Complete WCAG 2.2 AA baseline, clean UTF-8 Japanese copy after Owner-approved catalogue, visual regression and bundle optimization.  
**Files affected:** canonical feature styles/copy, accessibility tests, bundle/mojibake scripts, release documentation.  
**Estimated risk:** Medium; copy approval is a prerequisite.  
**Rollback:** Per-route style/copy commits.  
**Acceptance criteria:** no Production mojibake; keyboard/focus/reflow/reduced-motion pass; target screenshots; route chunks measured; no initial Labs; all P0 acceptance items pass.  
**Tests:** full suite, automated accessibility plus manual matrix, 320px/200% reflow, six visual viewports, bundle/security scans.

## Required Owner decisions before later phases

1. Router: approve `react-router-dom` or select dependency-free router.
2. Provide/approve clean UTF-8 Japanese canonical copy.
3. Provide an authenticated environment for screenshot/browser-console verification.
4. Confirm live migration level and deployment environment before any connected/Production label.
