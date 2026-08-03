# KEVIRIO Development and Release Runbook

| Metadata | Value |
| --- | --- |
| Document name | KEVIRIO Development and Release Runbook |
| Version | 2.1 |
| Status | DRAFT — OWNER REVIEW REQUIRED |
| Effective date | Not Effective — Owner approval required |
| Owner | KEVIRIO Owner |
| Supersedes | None until approved; intended to consolidate applicable development/release directives |
| Source of Truth level | Tier 3 after explicit Owner approval |
| Last reviewed | 2026-07-31 |
| Change summary | Defines the mandatory intake-to-release workflow, diagnostics, UI review, and approval gates. |

## 1. Universal change workflow

### Phase 1 — Intake

- Record the Owner request verbatim, define scope and exclusions, acceptance criteria, forbidden actions, and current Git state.
- Preserve all unrelated and pre-existing working-tree changes.
- Identify whether commit, push, deployment, migration, secrets, external execution, or irreversible actions require later explicit authority.

### Phase 2 — Audit

- Read applicable governance and specification files completely.
- Inspect implementation, tests, repository boundaries, current HEAD, and relevant diffs.
- Separate verified facts from assumptions. Mark insufficient evidence `Unknown`.
- Report conflicts before changing behavior.

### Phase 3 — Plan

- Choose the smallest safe change, list affected files, risk, rollback, tests, and browser validation path.
- Protect authentication, RLS, RPC, Approval, Evidence, Actual Revenue, Cost Guard, Workspace, Provider, Audit, and migration history.

### Phase 4 — Implement

- Work in bounded changes; avoid unrelated refactors and dependencies.
- Do not expose secrets or credentials.
- Implement affected Loading, Error, Empty, Locked, accessibility, and responsive states.
- Preserve Mock/Production separation and existing architecture.

### Phase 5 — Validate

Run, as applicable: JavaScript syntax/typecheck, targeted tests, full unit/integration/E2E, production build, source policy, security policy, credential boundary, credential exposure, migration verification, `git diff --check`, targeted diff review, Git status, and secret scan. A skipped or blocked check must be named with its reason.

### Phase 6 — Browser

- Start the real application and validate authenticated desktop and mobile flows.
- Check main/error/loading/empty paths, keyboard, focus, responsive layout, console, network, and screenshots.
- If the browser cannot be used, record exactly `Browser Validation: BLOCKED`. Never substitute source review or claim PASS.

### Phase 7 — Owner review

- Present the real implementation, browser evidence, differences from Owner references, risks, and remaining work.
- Do not call work `FINAL`, `COMPLETE`, or `OWNER APPROVED` before explicit Owner approval.

### Phase 8 — Release

The release sequence is:

`Code Validation → Commit → Push → Configure Preview Environment → Preview Deployment → Authenticated Browser Validation → Production Release Decision`

Commit, push, and deploy require distinct explicit Owner approvals. Never infer later approval from an earlier gate.

## 2. Human-error-first Owner login diagnostics

For Owner login failures, check safely in this order:

1. Confirm the email address visually.
2. Check Caps Lock.
3. Use the show-password control locally to verify entry; never share or record the password.
4. Check the password manager''s selected account.
5. Make one deliberate retry and avoid repeated rate-limit-triggering attempts.
6. Record only the sanitized error code/class.
7. Confirm one network sign-in request per submit.
8. Confirm the intended Supabase project using non-secret identifiers.
9. Verify that the user, Owner profile, role, and active status exist through authorized administration.
10. Inspect login code for input transformation, duplicate submit, or session races.
11. Check environment configuration without exposing values.
12. Consider password recovery only last; recovery is currently Not Implemented.

Never request a password in chat, print it, log it, reveal any portion, or conclude that a UI change caused credential failure without evidence. `invalid_credentials` alone does not prove the password changed.

## 3. Owner login manual smoke test

- Verify email/password controls, show/hide, Caps Lock notice, password manager autocomplete, Enter and button submit, and duplicate-submit prevention.
- With authorized credentials, verify one HTTP sign-in request, session persistence, active Owner verification, Home navigation, reload, logout, and re-login.
- With intentionally invalid local input, verify the Japanese generic error and short Caps Lock/show-password hints without user enumeration.
- Verify no secret appears in console, network reporting, UI persistence, or repository output.
- Verify desktop and mobile screenshots.

If a real authenticated browser is unavailable, report `Browser Validation: BLOCKED`; do not report the smoke test as validated.

## 4. UI reconstruction runbook

1. Start the local application and authenticate as Owner.
2. Review all ten Production screens on desktop and mobile before planning a shared correction.
3. Compare header, navigation, typography, spacing, KPI definitions, card hierarchy, state visibility, information density, Japanese-first copy, gold identity, and the primary next action against the Owner-approved visual source.
4. Verify Loading, Error, Empty, Locked, Actual, Forecast, and Mock states.
5. Produce a cross-screen difference list classified Critical, High, or Medium.
6. Correct shared tokens/components before isolated screen drift, without changing business behavior.
7. Re-run all validation and obtain Owner visual approval.

Do not declare UI complete until every Production screen has desktop/mobile browser evidence, token and navigation consistency, accessible interaction, clean console/network results, screenshot review, and explicit Owner approval.

## 5. Git and release rules

### Before commit

- Scope complete; tests/build pass; browser is PASS or explicitly BLOCKED; diff and secret scans complete; Owner reviews the exact staged files and diff.
- Obtain explicit commit approval immediately before executing the approved commit message.

### Before push

- Confirm branch, remote, upstream, and commit SHA. Obtain explicit push approval.
- Do not force push, amend, squash, rebase, tag, merge, release, or deploy unless separately authorized.

### Before deploy

- Confirm target, environment variables by presence—not values—migration requirements, rollback, preview result, and authenticated browser evidence.
- Obtain explicit deploy approval. Production release remains a separate Owner decision.

## 6. Database change runbook

- Never edit migrations `003`–`009`.
- Inspect the latest number and add a transaction-wrapped migration numbered `010` or later; do not renumber existing artifacts.
- Preserve RLS, workspace integrity, grants, RPC security, Approval/Evidence semantics, Actual-only analytics, auditability, and rollback planning.
- File existence does not prove remote application. Record remote evidence and authenticated smoke results separately.

## 7. Validation Levels

Every reported validation result uses one of these levels:

| Level | Name | Required evidence |
| --- | --- | --- |
| 1 | Source Validated | Applicable source and diff have been reviewed. |
| 2 | Build Validated | Build, tests, lint/source policy, and applicable policy checks are complete. |
| 3 | Browser Validated | Desktop, mobile, console, network, and keyboard behavior have been confirmed in a real browser. |
| 4 | Owner Approved | The Owner has inspected the real result and explicitly approved it. |

Levels are cumulative: a higher level requires the lower levels. Work must not be described as `Complete`, `Final`, or `Approved` before Browser Validation. `Owner Approved` is reserved exclusively for explicit Owner approval.

## 8. Repository Clean Rule

Before commit, inspect the intended staged scope and confirm zero unresolved occurrences of:

- TODO
- FIXME
- `console.log`
- `debugger`
- Unused imports
- Unused variables
- Temporary comments
- Secrets
- Hardcoded credentials

An allowlisted tooling occurrence is acceptable only when it is intentional, documented, non-production, and verified by the applicable policy test. Otherwise the commit is blocked. The check must not modify or discard unrelated Owner work.

## 9. Owner Review Checklist

Before requesting Owner Review, record the result of every item:

- [ ] Security
- [ ] Architecture
- [ ] Business Logic
- [ ] UI
- [ ] UX
- [ ] Accessibility
- [ ] Performance
- [ ] Evidence
- [ ] Tests
- [ ] Browser
- [ ] Documentation
- [ ] Git Status
- [ ] Owner Approval

Use `PASS`, `FAIL`, `BLOCKED`, `Unknown`, or `Not Applicable` with evidence. An unchecked or blocked Browser item prevents `Complete`, `Final`, and `Approved` claims. The Owner Approval item can be completed only by the Owner.

## 10. Governance stop condition

Version 2.1 completes the planned governance design after this final refinement. Do not propose or add further governance unless the Owner explicitly reopens governance work. The next permitted phase is Owner review of the real UI, followed by evidence-based comparison with the approved visual source and Design System integration work.
