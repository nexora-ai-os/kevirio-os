# KEVIRIO Development Constitution

| Metadata | Value |
| --- | --- |
| Document name | KEVIRIO Development Constitution |
| Version | 2.1 |
| Status | DRAFT — OWNER REVIEW REQUIRED |
| Effective date | Not Effective — Owner approval required |
| Owner | KEVIRIO Owner |
| Supersedes | None until approved; intended to consolidate applicable Owner directives and the 2026-07-27 handover baseline |
| Source of Truth level | Tier 1 after explicit Owner approval |
| Last reviewed | 2026-07-31 |
| Change summary | Establishes product identity, authority, safety, truth, design, and completion rules. |

## 1. System definition

KEVIRIO is an **AI Company Operating System**. Its purpose is to help the Owner operate a company through governed AI Employees, workflows, evidence, approvals, revenue records, providers, cost controls, and audit trails. Product decisions must not reduce KEVIRIO to a generic dashboard or imply autonomy that the system does not possess.

## 2. Product principles

1. **Owner authority:** the Owner makes final business, financial, provider, execution, release, and risk decisions.
2. **Permission before action:** an AI Employee may act only within its declared role, workspace, capability, provider scope, cost ceiling, and approval state.
3. **Fail closed:** unknown configuration, permission, identity, workspace, cost, evidence, or provider state is denied—not inferred as safe.
4. **One next action:** primary screens should make the most important truthful Owner action clear without fabricating urgency or capability.
5. **Profit First:** revenue presentation must preserve costs, evidence, and actual/forecast distinctions so apparent growth cannot conceal unverified or unprofitable activity.
6. **No silent semantic change:** Approval, Evidence, Actual Revenue, Cost Guard, Workspace, Provider, and Audit behavior may not be reinterpreted during UI or refactoring work.

## 3. Brand and UI constitution

- The Owner-approved visual source of truth uses **White × Champagne Gold × Silver × Soft Blue × Pale Purple**. Black, mint, or aqua must not become the primary reinterpretation.
- The experience is Japanese-first where canonical Japanese copy exists. Product wording must not be invented when the canonical copy is unknown.
- Premium quality comes from hierarchy, spacing, typography, restraint, and truthful states—not decorative claims.
- State must never be communicated by color alone. Labels must identify Actual, Forecast, Mock, Locked, Error, Loading, and Empty states.
- Desktop and mobile, keyboard operation, focus order, reduced motion, semantic landmarks, and readable contrast are completion requirements.
- A source image or specification can guide implementation; only browser evidence and Owner review can establish visual acceptance.

## 4. Truth and evidence constitution

- `ACTUAL`, `FORECAST`, `MOCK`, `SAMPLE`, `TEST`, and `UNCONNECTED` are distinct truth classes.
- Mock, forecast, test, localStorage, pending Evidence, and fixture data must never enter Actual analytics.
- Actual Revenue requires the canonical production repository, accepted Evidence, workspace integrity, and the required Owner verification/approval contract.
- Missing data is `Unknown`, `Not Implemented`, `Unconnected`, or an explicit empty state. It is not zero and must not be synthesized.
- Approval snapshots and audit records retain their established immutable or append-only semantics.

## 5. Owner authority and execution

- External Execution is `LOCKED` by default. Dry Run and manual execution packages do not authorize an external send.
- Provider credentials are server-only, never displayed, logged, placed in client state, or committed.
- Provider execution requires the existing gateway, allowlist, permission checks, Cost Guard, bounded retry policy, and any required one-time Approval. No direct provider bypass is permitted.
- Provider telemetry must preserve, where the implemented contract supports it: prompt version, prompt hash, model, temperature, input/output usage, cost, latency, outcome, and correlation/audit identifiers. Absence must be reported; values must not be invented.
- Commit, push, and deploy are three separate Owner-controlled actions. Approval for one does not imply approval for another.

## 6. Change discipline

- Preserve repository, protected RPC, RLS, authentication, Approval, Evidence, Actual Revenue, Cost Guard, Workspace, Provider, and Audit boundaries.
- Database evolution is additive. Migrations `003`–`009` are protected historical artifacts and must never be modified directly. New database changes use migration `010` or later without renumbering existing files.
- Do not merge Mock and Production implementations, expose unfinished Labs, enable External Execution, migrate framework/language/CSS architecture, or install unnecessary dependencies without explicit Owner authority.
- Existing working-tree changes belong to the Owner unless proven otherwise. Preserve unrelated changes and never stage them silently.
- A material conflict between an Owner directive, governance, and implementation must be reported before behavior is changed.

## 7. Definition of Done

A change is done only when:

1. Scope and exclusions are explicit.
2. Current implementation was inspected and the smallest safe change was made.
3. Syntax, targeted tests, relevant unit/integration/E2E suites, build, security policies, credential boundaries, diff checks, and secret checks pass or are truthfully marked blocked.
4. Loading, Error, Empty, Locked, permission, and data-truth states affected by the change are handled.
5. Desktop/mobile and accessibility are validated in a real browser when available. If unavailable, the result is `Browser Validation: BLOCKED`, never PASS.
6. Documentation, architecture boundaries, and rollback strategy are current.
7. The Owner reviews the real result before `FINAL`, release, or production claims.
8. Commit, push, and deploy occur only after their respective explicit Owner approvals.

## 8. Decision Framework

When multiple valid options exist, decisions use this fixed priority:

1. **Level 1 — Security**
2. **Level 2 — Data Integrity**
3. **Level 3 — Business Value**
4. **Level 4 — User Experience**
5. **Level 5 — Maintainability**
6. **Level 6 — Performance**
7. **Level 7 — Visual Beauty**

A lower level must never be improved by sacrificing a higher level. Visual quality cannot weaken Security. Performance cannot weaken Evidence or Data Integrity.

## 9. UI Quality Standard

UI quality is evaluated as practical business value, not merely whether a screen looks attractive. Each axis receives a score out of 100:

1. Visual
2. Information Architecture
3. Interaction
4. Accessibility
5. Performance
6. Consistency

| Score | Decision |
| --- | --- |
| 90–100 | PASS |
| 80–89 | REVIEW REQUIRED |
| 0–79 | REWORK REQUIRED |

The six scores remain separate. A high Visual score does not compensate for a failing Security boundary, inaccessible interaction, misleading information architecture, or insufficient practical value.

## 10. Design System Rule

The following shared design concerns are changed through Design Tokens and the shared Design System, not through independent screen-level styling:

- Color
- Typography
- Spacing
- Radius
- Shadow
- Elevation
- Motion
- Icon
- Button
- Card
- Modal
- Table
- Chart
- Form

Shared components and primitives take precedence over new screen-specific CSS. A screen-specific exception requires an evidenced product need and must not duplicate or override a shared contract silently.

## 11. AI Employee Contract

An AI Employee cannot be added to Production until all of the following are explicitly defined and validated:

- Role
- Permission
- Input
- Output
- Failure
- Retry
- Owner Approval
- Evidence
- Metrics
- Cost
- Latency
- Version
- Prompt Hash

An absent or indeterminate field fails closed. Prototype, Mock, or Conditional behavior must remain labeled as such and cannot be promoted by UI wording alone.
