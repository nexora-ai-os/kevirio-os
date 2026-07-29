# KEVIRIO UI/UX MASTER SPEC v1.0

**Document ID:** KEVIRIO-UIUX-MASTER-SPEC-V1  
**Version:** 1.0.0  
**Status:** Production Baseline / Single Source of Truth  
**Date:** 2026-07-29  
**Product:** KEVIRIO — AI Company Operating System  
**Audience:** Owner, Product, Design, Frontend, Backend, QA, AI coding agents  
**Supersedes:** All previous exploratory UI concepts and draft visual directions

> This specification is grounded in the formal development handover dated 2026-07-29.
It preserves the existing production constraints, including Owner-only access,
Workspace boundaries, immutable approval snapshots, evidence-gated Actual revenue,
provider credential secrecy, Cost Guard fail-closed behavior, and External Execution=false.

---

# 0. Executive Summary

KEVIRIO is not a generic SaaS dashboard, chat product, CRM, task manager, or analytics portal.
It is an **AI Company Operating System** in which the Owner makes decisions and AI Employees
perform bounded work under explicit permission, cost, approval, audit, evidence, and workspace rules.

The current platform has a strong production foundation but an inconsistent user interface.
Production-canonical screens, legacy Mock Labs, localStorage prototypes, provider readiness views,
and AI Employee concepts coexist inside one navigation structure. The UI must therefore be rebuilt
around semantic truth before it is rebuilt around visual beauty.

This specification defines the minimum complete production design system for KEVIRIO v1.
It is deliberately narrower than a large enterprise design bible, but complete enough to govern
the first public-quality production release.

The core design problem is:

```text
Mock ≠ Forecast ≠ Approved ≠ Execution Ready ≠ Externally Executed ≠ Verified Actual
```

No visual treatment, copy, interaction, metric, badge, chart, or notification may blur those states.

The target product experience is:

- understandable within three seconds;
- premium without being ornamental;
- Japanese-first with selective English;
- calm enough for daily use;
- lightweight enough for the existing React/Vite stack;
- safe by default;
- explicit about what AI can and cannot do;
- consistent across production, provider, and employee workflows.

---

# 1. Product Constitution

## 1.1 Product Definition

KEVIRIO is an AI Company Operating System that provides an Owner with one operating environment
for revenue, offers, approvals, AI Employees, workflows, provider connections, costs, evidence,
and business performance.

The Owner's role is to:

1. understand the current company state;
2. make decisions;
3. grant or deny permission;
4. review evidence;
5. correct direction;
6. monitor costs and risk.

The AI system's role is to:

1. analyze;
2. propose;
3. prepare;
4. execute only within permitted boundaries;
5. report;
6. preserve auditability;
7. stop when state, approval, cost, identity, or provider conditions are invalid.

## 1.2 Product Promise

> **Owner thinks less. AI works more. Every important action remains visible, bounded, and reversible where possible.**

## 1.3 Product Principles

### P1 — Truth Before Beauty
The interface must represent real system state before it represents brand aspiration.

### P2 — Decision Before Detail
The Owner sees the next required decision before secondary analytics or historical detail.

### P3 — One Screen, One Primary Job
Every route has one dominant purpose and one obvious primary action.

### P4 — Production and Experimentation Are Separate
Production navigation never mixes with Mock Labs.

### P5 — Approval Is Not Execution
An approved item is visually and semantically distinct from an externally executed item.

### P6 — Connection Is Not Permission
OAuth connection, granted scope, operational readiness, and write capability are separate states.

### P7 — Unknown Is Not Zero
Missing or unavailable values must never be rendered as zero.

### P8 — Actual Requires Evidence
Actual revenue appears only after verified evidence and canonical recording.

### P9 — Lightness Is a Feature
Luxury comes from typography, spacing, hierarchy, and restraint—not large effects or dependencies.

### P10 — AI Must Be Legible
Users must understand what an AI Employee is doing, why, under which permission, at what cost,
and what happens next.

## 1.4 Non-Negotiable Architecture Constraints

The UI must never:

- expose service-role or provider credentials;
- trust owner identity from client input;
- mutate protected tables directly from the browser;
- weaken RLS or workspace scoping;
- bypass canonical repositories or protected RPC boundaries;
- infer Actual revenue from forecast, package, or evidence-waiting data;
- treat approval as external execution;
- enable locked provider write capabilities;
- hide Cost Guard blocks;
- suppress required audit events;
- represent unavailable usage, ledger, or pricing data as safe;
- merge Mock records with production data;
- re-enable legacy ApprovalCenter as the primary approval route;
- remove one-time approval use, expiry, payload hash, or artifact-version checks;
- imply that Manual Execution Package means a message was sent;
- imply that OAuth scope means capability execution is allowed;
- enable External Execution without a separately approved architecture change.

## 1.5 Product Quality Bar

A screen is production-ready only if:

- its primary purpose is understood in three seconds;
- the main action is visible without scrolling on standard desktop;
- keyboard navigation works;
- states are distinguishable without color alone;
- Japanese copy is natural and free from mojibake;
- loading, empty, error, blocked, and success states are defined;
- Mock/Forecast/Actual semantics are explicit;
- responsive behavior is defined;
- audit-relevant actions are preserved;
- no critical architecture boundary is bypassed;
- the screen uses shared tokens and primitives;
- the screen adds no unnecessary runtime dependency.

---

# 2. UX Constitution

## 2.1 Experience Model

The default Owner journey is:

```text
Understand → Decide → Approve → Observe → Verify → Improve
```

The interface must not force the Owner to think in backend terms such as tables, migrations,
RPC names, provider adapter names, or internal IDs unless they open an Audit or Technical Details view.

## 2.2 Three-Second Hierarchy

Every screen must establish, in order:

1. **Where am I?**
2. **What is the state?**
3. **What needs my attention?**
4. **What can I do now?**
5. **What happened recently?**

## 2.3 Information Layers

### Layer 1 — Decision Surface
Shows only essential state and primary action.

### Layer 2 — Operational Summary
Shows status, owner, due state, cost, and next step.

### Layer 3 — Analysis
Shows trends, causes, comparisons, and recommendations.

### Layer 4 — Audit
Shows hashes, IDs, provider events, timestamps, scopes, workflow events, and technical detail.

Layers must be progressively disclosed. Audit detail must never dominate primary business views.

## 2.4 Interaction Rules

- One primary CTA per screen region.
- Destructive or irreversible actions require explicit confirmation.
- Disabled controls must explain why.
- Permission or Cost Guard blocks must show the condition to resolve.
- No ambiguous labels such as “Run”, “Go”, or “OK” without context.
- No hidden critical actions behind hover-only UI.
- No double confirmation for reversible, low-risk UI-only changes.
- Confirmation dialogs describe the outcome, not the implementation.
- Toasts confirm completion but do not replace persistent state.
- Critical failures remain visible until acknowledged or resolved.

## 2.5 Japanese and English Usage

Japanese is the default language for:

- decisions;
- warnings;
- approval copy;
- business status;
- explanations;
- error recovery;
- Owner actions.

English is used selectively for:

- product name;
- canonical module names where brand value is added;
- short system labels;
- industry-standard technical terms;
- status tags where brevity is useful.

Preferred pattern:

```text
承認 / Approval
AI社員 / AI Employees
連携 / Integrations
分析 / Insights
```

Avoid English-only paragraphs. Avoid awkward bilingual duplication on every label.

## 2.6 Copy Length Rules

- Sidebar item: 2–8 Japanese characters or 1–2 English words.
- Page title: maximum 18 Japanese characters.
- Card title: maximum 14 Japanese characters.
- Button: maximum 10 Japanese characters.
- Helper text: maximum 60 Japanese characters per paragraph.
- Toast: maximum two short lines.
- Modal body: maximum three logical blocks.
- Empty state: one title, one explanation, one optional action.

---

# 3. Information Architecture

## 3.1 Primary Navigation

Production navigation is limited to seven destinations:

1. **ホーム / Home**
2. **AI社員 / AI Employees**
3. **承認 / Approvals**
4. **業務 / Operations**
5. **売上 / Revenue**
6. **分析 / Insights**
7. **連携 / Integrations**

Secondary destinations:

- Inbox
- Settings
- Audit
- Labs — visible only in Developer Mode

## 3.2 Route Map

```text
/
├── /home
├── /employees
│   ├── /employees/:employeeId
│   └── /employees/:employeeId/tasks/:taskId
├── /approvals
│   └── /approvals/:approvalId
├── /operations
│   ├── /operations/offers
│   ├── /operations/workflows
│   └── /operations/:operationId
├── /revenue
│   ├── /revenue/campaigns
│   ├── /revenue/evidence
│   └── /revenue/records/:recordId
├── /insights
├── /integrations
│   └── /integrations/:providerId
├── /inbox
├── /audit
├── /settings
└── /labs
```

`/` redirects to `/home`.

## 3.3 Navigation Grouping

### Main
Home, AI Employees, Approvals, Operations, Revenue, Insights, Integrations.

### Utility
Inbox, Audit, Settings.

### Developer
Labs, Diagnostics, Mock Data, Provider Dry Run, Component Preview.

Developer group is hidden by default and must not appear for normal Owner use.

## 3.4 Legacy Route Mapping

| Existing Key | New Route | Action |
|---|---|---|
| `home` | `/home` | Keep canonical |
| `production` | `/revenue` | Rename and preserve canonical repository |
| `review` | `/labs/review` | Move to Labs until productionized |
| `campaign` | `/operations/offers` | Keep canonical |
| `approval` | `/approvals` | Keep canonical revenue approval flow |
| `analytics` | `/insights` | Separate actual and forecast views |
| `apiCenter` | `/integrations` or `/labs/provider-readiness` | Split |
| `providerHub` | `/integrations` | Keep read-only/locked states |
| `googleOperations` | `/employees/google_operations` | Reframe as employee detail |
| `operations` | `/operations` | Remove alias ambiguity |
| `ceo` | `/labs/ai-ceo` | Move to Labs |
| `memory` | `/labs/business-memory` | Keep local prototype isolated |
| `opportunity` | `/labs/market-intelligence` | Move to Labs |
| `trends` | `/labs/trends` | Move to Labs |
| `workflows` | `/operations/workflows` or Labs | Productionize selectively |
| `dashboard` | `/labs/mission` | Remove from production nav |
| `workEngine` | `/labs/work-engine` | Move to Labs |
| `work` | `/labs/work-command` | Move to Labs |
| `affiliate` | `/labs/affiliate` | Move to Labs |
| `content` | `/labs/content` | Move to Labs |
| `assistant` | `/labs/assistant` | Move to Labs |
| `settings` | `/settings` | Keep |

## 3.5 Owner Action Queue

A shared Owner Action Queue appears on Home, Approvals, Revenue, Operations, and Integrations.
It is not duplicated data; it is a consistent presentation of canonical action requirements.

Action categories:

- approval required;
- evidence review;
- connection required;
- scope required;
- cost approval;
- failure recovery;
- revision requested;
- setup incomplete.

Priority order:

1. security or cost block;
2. expiring approval;
3. failed production workflow;
4. evidence required for Actual;
5. pending approval;
6. setup or connection;
7. informational recommendation.

---

# 4. Design Language

## 4.1 Brand Direction

KEVIRIO should feel:

- precise;
- calm;
- premium;
- modern;
- responsible;
- intelligent;
- operational.

It must not feel:

- playful;
- gamified;
- cyberpunk;
- overly corporate;
- visually noisy;
- generic SaaS-template;
- dark by default;
- glass-heavy;
- gold-saturated.

## 4.2 Visual Formula

```text
White space + strong typography + restrained gold + semantic state color + precise motion
```

## 4.3 Color Tokens

```css
:root {
  --color-bg-canvas: #F7F8F6;
  --color-bg-surface: #FFFFFF;
  --color-bg-subtle: #F1F3F0;
  --color-bg-elevated: #FFFFFF;

  --color-text-primary: #151816;
  --color-text-secondary: #5B625E;
  --color-text-tertiary: #848B87;
  --color-text-inverse: #FFFFFF;

  --color-border-default: #E1E5E1;
  --color-border-strong: #C9CFCB;
  --color-border-focus: #8B7444;

  --color-brand-gold-50: #FBF8F1;
  --color-brand-gold-100: #F5EEDC;
  --color-brand-gold-300: #D7C28E;
  --color-brand-gold-500: #A98D52;
  --color-brand-gold-700: #715B2E;

  --color-success-50: #EEF8F1;
  --color-success-500: #2F7D4A;
  --color-success-700: #205A35;

  --color-info-50: #EEF5FB;
  --color-info-500: #3978A8;
  --color-info-700: #28597E;

  --color-ai-50: #F4F1FB;
  --color-ai-500: #7458A6;
  --color-ai-700: #543D7B;

  --color-warning-50: #FFF6E8;
  --color-warning-500: #A96513;
  --color-warning-700: #7B480B;

  --color-danger-50: #FFF0EF;
  --color-danger-500: #B2453E;
  --color-danger-700: #82312C;

  --color-mock: #7C8793;
  --color-forecast: #3978A8;
  --color-approved: #A98D52;
  --color-ready: #7458A6;
  --color-running: #2F7D4A;
  --color-actual: #151816;
  --color-locked: #6E7470;
}
```

## 4.4 State Color Rules

Color is always paired with:

- icon;
- text label;
- shape or border pattern;
- optional background tint.

Examples:

- Mock: flask icon, dashed border, “MOCK”.
- Forecast: trend icon, blue tint, “予測”.
- Approved: check-circle, gold border, “承認済み”.
- Ready: arrow-right-circle, violet tint, “実行準備完了”.
- Running: pulse dot, green tint, “処理中”.
- Actual: verified seal icon, dark text, “実績”.
- Locked: lock icon, gray background, “ロック中”.

## 4.5 Typography

Font stack:

```css
font-family:
  Inter,
  "Noto Sans JP",
  "Hiragino Kaku Gothic ProN",
  "Yu Gothic UI",
  Arial,
  sans-serif;
```

Production should self-host or reliably load only one optional web font family.
The UI must remain usable with system fallback.

Type scale:

| Token | Size / Line | Weight | Use |
|---|---:|---:|---|
| `display-lg` | 40/48 | 700 | Home hero metric |
| `display-md` | 32/40 | 700 | Page summary |
| `heading-xl` | 28/36 | 700 | Page title |
| `heading-lg` | 22/30 | 700 | Section title |
| `heading-md` | 18/26 | 650 | Card title |
| `body-lg` | 16/26 | 400 | Primary reading |
| `body-md` | 14/22 | 400 | Default UI |
| `body-sm` | 12/18 | 400 | Helper text |
| `label-md` | 13/18 | 600 | Control label |
| `label-sm` | 11/16 | 650 | Badge |
| `mono-sm` | 12/18 | 500 | IDs, hashes |

Rules:

- Avoid 800–900 weight except brand marks or singular hero numbers.
- Japanese body text should use 1.6–1.75 line-height.
- Avoid all-caps in Japanese.
- English all-caps is restricted to short environment badges.

## 4.6 Spacing Scale

```css
--space-0: 0;
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
```

Do not introduce arbitrary spacing unless a documented exception is required.

## 4.7 Radius

```css
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 22px;
--radius-pill: 999px;
```

- Controls: 10–12px.
- Cards: 16px.
- Hero surfaces: 22px.
- Avoid excessive 28–34px radii.
- Pills only for compact status or filters.

## 4.8 Shadows

```css
--shadow-1: 0 1px 2px rgba(20, 24, 22, 0.05);
--shadow-2: 0 8px 24px rgba(20, 24, 22, 0.07);
--shadow-3: 0 18px 50px rgba(20, 24, 22, 0.10);
--shadow-focus: 0 0 0 3px rgba(169, 141, 82, 0.22);
```

Use borders before shadows. Use `shadow-3` only for modal or floating critical layer.

## 4.9 Motion

Motion communicates state; it is not decoration.

Duration:

```css
--motion-fast: 120ms;
--motion-base: 180ms;
--motion-slow: 280ms;
```

Allowed:

- hover/focus transition;
- modal fade and scale;
- drawer slide;
- one-time success ring;
- subtle running pulse;
- number transition for a real data update;
- skeleton shimmer when reduced-motion is not requested.

Forbidden:

- continuous decorative orb drift on production screens;
- looping gold glow;
- parallax;
- large blur animation;
- bouncing cards;
- animated backgrounds behind data;
- auto-playing video.

`prefers-reduced-motion: reduce` must disable non-essential movement.

## 4.10 Iconography

- Use one icon set, preferably `lucide-react`.
- Default sizes: 16, 18, 20, 24.
- Stroke width: 1.75 or 2.
- Icons never replace critical labels.
- Technical provider marks may use official logos only where licensing permits.
- Inline SVG duplicates should be removed from Sidebar over time.

---

# 5. Layout System

## 5.1 Desktop Shell

```text
Sidebar: 240px
Topbar: 64px
Content max-width: 1440px
Page horizontal padding: 32px
Section gap: 32px
Card gap: 16px or 24px
```

The existing fixed 280px sidebar should be reduced to 240px.

## 5.2 Tablet

```text
Sidebar: collapsible 72px rail
Content padding: 24px
Two-column grids collapse selectively
```

## 5.3 Mobile

```text
Top app bar: 56px
Bottom navigation: maximum 5 primary items
More menu: remaining routes
Content padding: 16px
Cards: single column
Tables: responsive list or horizontal scroll only when semantically necessary
```

## 5.4 Grid

- 12-column desktop.
- 8-column tablet.
- 4-column mobile.
- KPI cards use 4/4/4 or 3/3/3/3.
- Decision content receives more width than contextual detail.
- Main action panel should usually occupy 7–8 columns.

## 5.5 Density

Default density is comfortable, not compact.

Compact density is allowed only for:

- audit event lists;
- technical logs;
- high-volume tables;
- optional user setting.

---

# 6. Semantic State System

## 6.1 Business Truth States

| State | Meaning | UI Label | Treatment |
|---|---|---|---|
| Mock | Synthetic/local test data | MOCK | dashed neutral |
| Forecast | Predicted, not earned | 予測 | blue |
| Candidate | Prepared but not approved | 候補 | neutral |
| Pending | Waiting for action | 対応待ち | amber |
| Approved | Owner approved exact snapshot | 承認済み | gold |
| Ready | Preconditions satisfied | 実行準備完了 | violet |
| Running | Active bounded execution | 処理中 | green pulse |
| Partial | Some work completed | 一部完了 | amber |
| Completed | Workflow completed | 完了 | green |
| Evidence Waiting | External result not verified | 証拠待ち | amber |
| Verified Actual | Evidence verified and recorded | 実績 | dark seal |
| Failed | Terminal failure | 失敗 | red |
| Cancelled | Explicitly cancelled | キャンセル | neutral |
| Expired | Approval or task expired | 期限切れ | neutral-warning |
| Locked | Capability prohibited | ロック中 | gray lock |
| Unknown | Data unavailable | 不明 | neutral question |

## 6.2 Environment Badge

Every screen displays exactly one environment badge in the shell:

- `PRODUCTION DATA`
- `SANDBOX`
- `DRY RUN`
- `MOCK`
- `LOCKED`

The badge must be derived from current view semantics, not manually selected by presentation code.

## 6.3 Provider State Ladder

```text
未設定
→ OAuth準備済み
→ 接続済み・読み取り専用
→ 追加承認が必要
→ 書き込みロック中
→ 利用停止
```

Connection and execution status must be displayed as separate rows.

## 6.4 Approval State Anatomy

An approval card must show:

- request title;
- exact object/version;
- requested capability;
- business impact;
- risk;
- cost ceiling;
- expiry;
- snapshot status;
- external execution effect: usually “外部実行は有効になりません”;
- primary decision actions;
- audit link.

---

# 7. Component Library

## 7.1 Button

Variants:

- Primary
- Secondary
- Quiet
- Danger
- Approval
- Icon
- Link

States:

- default;
- hover;
- active;
- focus-visible;
- disabled;
- loading;
- success transient.

Rules:

- one primary button per decision region;
- destructive actions use Danger, not gold;
- Approval variant uses restrained gold;
- disabled button includes adjacent reason;
- loading keeps original width.

## 7.2 Card

Variants:

- Surface
- Decision
- KPI
- Status
- Employee
- Provider
- Audit
- Warning
- Empty

Card anatomy:

- optional eyebrow;
- title;
- status;
- content;
- footer;
- optional action.

Do not nest more than two card levels.

## 7.3 StatusBadge

Required props:

```js
{
  state,
  label,
  environment,
  size,
  icon,
  ariaLabel
}
```

Badge labels come from a centralized semantic map.
No component may invent ad hoc colors for a known state.

## 7.4 KPI Card

Must show:

- metric label;
- value or `未登録`;
- period;
- state (`Actual` or `Forecast`);
- comparison basis;
- optional trend;
- data freshness.

Never show a forecast trend beside Actual without explicit grouping.

## 7.5 Owner Action Item

Fields:

- priority;
- title;
- reason;
- due/expiry;
- object type;
- semantic state;
- primary action;
- secondary details.

## 7.6 AI Employee Card

Fields:

- employee name;
- role;
- maturity;
- current status;
- active task;
- permission summary;
- provider;
- cost today;
- last activity;
- external execution state.

Do not use cartoon avatars. Use a refined monogram or role icon.

## 7.7 Provider Card

Fields:

- provider;
- connection status;
- token storage status;
- read capability;
- write capability;
- scope;
- quota;
- cost guard;
- last health event;
- next required Owner action.

## 7.8 Approval Card

Variants:

- Standard
- Cost threshold
- External action
- Actual revenue verification
- Risk acceptance
- Revision

## 7.9 Table

Required features:

- semantic header cells;
- keyboard accessible row actions;
- sorting state;
- clear empty state;
- loading skeleton;
- responsive fallback;
- column priority;
- sticky header only for long data.

Do not use tables for fewer than three comparable rows.

## 7.10 Modal

Use for:

- focused confirmation;
- small form;
- blocking risk acknowledgement.

Do not use for long workflows. Use a page or drawer.

Required:

- focus trap;
- Escape close unless dangerous in-progress transaction;
- labelled title;
- return focus;
- explicit primary/secondary action;
- no background scroll.

## 7.11 Drawer

Use for:

- details;
- audit;
- secondary editing;
- filters.

Width: 420–560px desktop; full screen mobile.

## 7.12 Toast

Types:

- success;
- info;
- warning;
- error.

Critical errors are not toast-only.
Default timeout 4–6 seconds; errors may persist.

## 7.13 Empty State

Types:

- no data yet;
- filtered empty;
- permission blocked;
- connection required;
- feature locked;
- system unavailable.

Each type has its own copy and action.
Never use “データがありません” for every case.

## 7.14 Loading

- Skeleton for content-shaped loading.
- Spinner only for short actions.
- Progress for multi-step work.
- Running AI task shows current step when available.
- Never fake progress percentages.

## 7.15 Form Controls

Create shared:

- Input;
- Textarea;
- Select;
- Checkbox;
- Radio;
- Switch;
- FormField;
- Date/Time;
- Currency;
- Search;
- Filter;
- Segmented Control.

Every field needs label, help, error association, disabled reason, and focus-visible.

## 7.16 Timeline

Use for:

- workflow events;
- approval history;
- evidence review;
- provider health;
- audit summary.

## 7.17 Chart

Allowed charts:

- line;
- bar;
- stacked bar;
- compact sparkline;
- donut only for 2–4 categories.

Every chart must include:

- textual summary;
- clear unit;
- Actual/Forecast distinction;
- accessible fallback;
- no 3D;
- no decorative gradient area by default.

---

# 8. Screen Blueprints

## 8.1 Home

### Purpose
Give the Owner a five-second understanding of company state and next decision.

### Layout

1. Page header with date, environment badge, workspace.
2. Morning Brief.
3. Next Decision / Owner Action Queue.
4. Business Health.
5. AI Workforce status.
6. Recent verified result.
7. Critical alerts only when present.

### Morning Brief Copy Pattern

```text
おはようございます。
今日は承認2件、証拠確認1件があります。
重大な障害はありません。
```

### Business Health

Show:

- verified Actual revenue;
- forecast separately;
- operating cost;
- active operations;
- blocked operations.

### Primary CTA
The highest-priority Owner action.

### Forbidden
- dense dashboard grid;
- more than six top-level metrics;
- legacy mock widgets;
- technical provider details;
- charts above decisions.

## 8.2 AI Employees

### List Page

Sections:

- active;
- waiting;
- blocked;
- planned.

Filters:

- status;
- maturity;
- provider;
- capability.

Each card shows current task and permission boundary.

### Detail Page

Tabs:

- Overview
- Tasks
- Capabilities
- Cost
- Audit

Overview includes:

- role;
- maturity;
- current work;
- provider connection;
- permission;
- external execution state;
- latest handoff;
- failure/retry state.

For `google_operations`, show six workflows and read/write capability split.

## 8.3 Approvals

### Purpose
Allow exact, informed Owner decisions without implying execution.

### Page Structure

- pending count;
- expiring soon;
- risk/cost summary;
- approval list;
- completed decisions;
- audit access.

### Approval Detail

Show:

- what is being approved;
- why;
- exact snapshot/version;
- what will happen next;
- what will not happen;
- cost;
- expiry;
- permission;
- evidence or artifact preview;
- approve, revise, reject, hold.

Default footer statement:

> この承認だけでは外部実行は有効になりません。

## 8.4 Operations

### Purpose
Manage offers, workflows, and bounded operational progress.

Subroutes:

- Offers
- Workflows
- Activity

Operations list fields:

- title;
- state;
- owner/AI Employee;
- current step;
- next requirement;
- cost;
- updated;
- environment.

## 8.5 Revenue

### Purpose
Represent revenue truth from candidate through verified Actual.

Sections:

- Actual
- Forecast
- Evidence waiting
- Campaigns
- Manual packages
- Records

### Actual Guarantee

Every Actual metric displays:

- Verified Evidence
- Owner Approved
- Recorded
- timestamp

### Empty Actual

Use:

```text
実績はまだ登録されていません
証拠確認が完了した売上のみ、ここに表示されます。
```

Never show `¥0` unless a verified record actually equals zero.

## 8.6 Insights

### Purpose
Explain what changed, why, and what to do next.

Tabs:

- Business
- Revenue
- Cost
- Operations
- Learning

Each insight includes:

- observation;
- evidence;
- confidence;
- recommendation;
- impact;
- source state.

Actual and Forecast are separate series and separate legends.

## 8.7 Integrations

### Purpose
Show provider readiness, connection, scope, quota, cost, and lock state.

Provider detail tabs:

- Overview
- Capabilities
- Access
- Usage
- Health
- Audit

The page must make these distinctions explicit:

- connected;
- authenticated;
- read allowed;
- write allowed;
- approval required;
- globally locked;
- provider locked;
- cost blocked.

## 8.8 Inbox

Contains only actionable or important system events:

- approval request;
- expiry;
- provider connection issue;
- failure;
- evidence waiting;
- cost threshold;
- completed handoff.

No social feed behavior.

## 8.9 Audit

Designed for traceability, not daily operation.

Filters:

- object;
- actor;
- event type;
- provider;
- date;
- workspace;
- correlation ID.

Sensitive values remain redacted.

## 8.10 Settings

Sections:

- Workspace
- Members
- Preferences
- Notifications
- Cost policy
- Developer Mode
- Data and reset

Reset controls must accurately describe what is and is not deleted.
Legacy partial `resetAll` behavior must not be presented as complete reset.

## 8.11 Login

- brand mark;
- short value statement;
- email;
- password;
- error state;
- no marketing carousel;
- no dark visual overload.

## 8.12 Onboarding

Steps:

1. Confirm Owner profile.
2. Confirm workspace.
3. Set basic brand/business context.
4. Review safety boundaries.
5. Configure first provider read-only connection.
6. Enter Home.

Onboarding must not request write permission by default.

## 8.13 Labs

Developer Mode only.

Categories:

- Mock Experiences
- Experimental Workflows
- Provider Dry Run
- Legacy Components
- Component Preview
- Diagnostics

Persistent banner:

```text
LABS — この画面の内容は本番実績ではありません
```

---

# 9. Responsive Specification

## 9.1 Breakpoints

```css
--bp-sm: 640px;
--bp-md: 768px;
--bp-lg: 1024px;
--bp-xl: 1280px;
--bp-2xl: 1536px;
```

## 9.2 Mobile Priorities

Mobile shows:

1. environment;
2. critical action;
3. primary metric;
4. current employee/task;
5. recent result.

Detailed analytics and audit tables become secondary.

## 9.3 Navigation

Desktop: sidebar.  
Tablet: compact rail plus drawer.  
Mobile: bottom nav with Home, Approvals, Operations, Revenue, More.

## 9.4 Touch Targets

Minimum 44×44px.

---

# 10. Accessibility

Target: WCAG 2.2 AA.

Requirements:

- keyboard access for every action;
- visible focus;
- contrast minimum AA;
- state not conveyed by color alone;
- meaningful landmarks;
- correct heading hierarchy;
- labels for form fields;
- error messages linked with `aria-describedby`;
- modal focus management;
- accessible table semantics;
- chart summaries;
- reduced motion;
- screen-reader announcement for async completion;
- no auto-focus that disrupts reading;
- no keyboard trap;
- no placeholder-only labels.

---

# 11. Performance Budget

## 11.1 Targets

- Initial JS bundle: under 350 kB compressed target.
- Route-level code splitting required.
- No single production route chunk above 180 kB compressed target.
- LCP under 2.5s on standard 4G target.
- INP under 200ms target.
- CLS under 0.1.
- No continuous high-cost animation.
- Images must be responsive and lazy-loaded.
- Prefer SVG/icons over raster assets.
- Avoid adding UI frameworks unless an ADR proves necessity.

## 11.2 Current Debt Response

The current ~916 kB bundle warning requires:

- React lazy route loading;
- removal or isolation of legacy screens;
- component-level dead code cleanup;
- separation of Labs;
- elimination of duplicated icon implementations;
- splitting provider and analytics features;
- avoiding new chart libraries unless needed.

## 11.3 CSS

- Introduce `tokens.css`, `base.css`, `components.css`, route CSS modules or scoped files.
- Reduce the current global CSS concentration.
- No inline hardcoded semantic colors.
- No one-line compressed JSX in maintained production files.

---

# 12. Frontend Architecture Rules

## 12.1 Proposed Structure

```text
src/
├── app/
│   ├── App.jsx
│   ├── router.jsx
│   ├── providers/
│   └── shell/
├── design-system/
│   ├── tokens.css
│   ├── primitives/
│   ├── components/
│   └── patterns/
├── features/
│   ├── home/
│   ├── employees/
│   ├── approvals/
│   ├── operations/
│   ├── revenue/
│   ├── insights/
│   ├── integrations/
│   ├── inbox/
│   ├── audit/
│   ├── settings/
│   └── labs/
├── domain/
├── repositories/
├── services/
├── hooks/
└── utils/
```

## 12.2 Routing

Introduce `react-router-dom` only if accepted by the implementation owner.
Otherwise implement an equivalent robust URL router.
Required:

- deep links;
- refresh persistence;
- back/forward;
- not-found route;
- auth-protected routes;
- route-level lazy loading.

## 12.3 State

- Keep server truth in repositories/Supabase.
- Keep local UI state local.
- Do not duplicate canonical business state into localStorage.
- Mock state only inside Labs namespace.
- Do not keep all feature state in `App.jsx`.
- Use feature hooks and repository adapters.
- Avoid introducing a global state library unless demonstrably needed.

## 12.4 Type Safety

TypeScript is not required for v1 migration, but new critical domain boundaries should use:

- JSDoc typedefs;
- runtime validators;
- centralized enums/constants;
- exhaustive state maps.

A future TypeScript migration may be planned separately.

---

# 13. UX Writing System

## 13.1 Tone

- direct;
- calm;
- respectful;
- non-dramatic;
- specific;
- action-oriented.

## 13.2 Preferred Terms

| Avoid | Use |
|---|---|
| 実行しました when only approved | 承認しました |
| 売上0円 when unknown | 未登録 |
| 接続済み when read-only | 接続済み・読み取り専用 |
| 完了 when evidence waiting | 証拠確認待ち |
| 自動投稿できます when locked | 投稿機能はロック中 |
| エラーが発生しました | 具体的な原因と次の行動 |
| 失敗しました only | 失敗理由 + 再試行可否 |

## 13.3 Error Pattern

```text
タイトル: Google接続を確認できませんでした
説明: 保存済みの接続情報が無効、または期限切れの可能性があります。
次の行動: Googleを再接続
補足: 外部操作は実行されていません。
```

## 13.4 Blocked Pattern

```text
現在は実行できません
理由: 書き込み権限がロックされています
必要な対応: Owner承認とProvider実行設定の両方が必要です
```

---

# 14. Screen-Level Production Blueprint

This chapter is normative. It converts the earlier screen descriptions into implementation-ready
desktop, tablet, and mobile blueprints. Dimensions are CSS pixels at 100% zoom. Responsive behavior
must preserve decision hierarchy rather than merely stack every region.

## 14.1 Global Application Frame

### Desktop ≥ 1280px

```text
Viewport
├── Sidebar: 240px fixed
├── Main
│   ├── Topbar: 64px sticky
│   └── Page canvas
│       ├── max-width: 1440px
│       ├── horizontal padding: 32px
│       ├── top padding: 28px
│       └── bottom padding: 64px
```

Topbar left-to-right:

1. mobile/sidebar trigger when applicable;
2. breadcrumb or current module;
3. flexible spacer;
4. environment badge;
5. workspace label;
6. Inbox;
7. Owner menu.

The environment badge must never be hidden in production routes. Workspace must be visible without
opening Settings.

### Tablet 768–1279px

- Sidebar becomes a 72px rail.
- Labels appear through a deliberate drawer, not hover-only tooltips.
- Page padding: 24px.
- Three-column KPI groups become two columns.
- Decision panel always precedes context panels.

### Mobile < 768px

- Top app bar: 56px.
- Bottom navigation: 64px plus safe-area inset.
- Page padding: 16px.
- Page title and environment badge must appear before content.
- Fixed bottom actions may be used only for one high-priority decision.
- Tables become cards unless horizontal comparison is essential.

## 14.2 Home — Exact Composition

### Desktop Grid

```text
Row 1: Page Header                                      12 columns
Row 2: Morning Brief                                     8 columns
       Critical System Status                            4 columns
Row 3: Next Decision / Owner Action Queue                8 columns
       Business Health                                   4 columns
Row 4: Verified Actual / Forecast                        6 columns
       AI Workforce                                      6 columns
Row 5: Operations requiring attention                    7 columns
       Recent verified result                            5 columns
```

#### Header
- Minimum height: 64px.
- Title: 「ホーム」.
- Supporting text: current business date and concise system state.
- No CTA unless there is one globally dominant Owner action.

#### Morning Brief
- Minimum height: 180px.
- Maximum three sentences.
- Summarize pending decisions, verified business state, and critical exception state.
- AI-generated wording must be grounded in canonical data and carry `generated_at`.
- If the brief cannot be generated, show deterministic system summary instead of an error card.

#### Critical System Status
Shows only:
- Cost Guard;
- provider/system outage;
- workspace/security issue;
- external execution global state.

Normal state copy:
```text
重大な障害はありません
外部実行はロックされています
```

#### Owner Action Queue
- Initial visible items: maximum five.
- Each row minimum 72px.
- Highest severity first.
- Each action has exactly one primary action.
- “すべて見る” links to the relevant canonical module, not a duplicate queue route.

#### Business Health
Four rows maximum:
- verified Actual;
- approved forecast;
- operating cost;
- blocked work.

Unknown values render `未登録` or `取得できません`, never zero.

#### Revenue Comparison
Actual and Forecast must occupy separate visual blocks.
They may share a common time range only when both labels remain persistent.

#### AI Workforce
Shows:
- working;
- waiting;
- blocked;
- planned.
Each count links to a filtered employee list.

#### Empty Home
If no production data exists:
1. explain that no verified operating data exists;
2. show first setup action;
3. keep system safety state visible;
4. do not fill with mock graphs.

### Mobile Order

1. page title + environment;
2. critical system status;
3. next decision;
4. Morning Brief;
5. verified Actual;
6. Forecast;
7. AI Workforce;
8. recent verified result.

## 14.3 AI Employees — List

### Header
- Title: 「AI社員」.
- Secondary text: number by maturity and current activity.
- Primary CTA is absent in v1 unless a formal employee creation contract exists.

### Filter Bar
- status;
- maturity;
- capability;
- provider;
- search.
Filters persist in URL query parameters.

### Employee Card Dimensions
Desktop width: minimum 320px; recommended three cards at ≥1440px.
Card minimum height: 236px.

Anatomy:
1. role icon/monogram;
2. name;
3. role;
4. maturity badge;
5. execution state;
6. current task;
7. permission summary;
8. today cost;
9. last activity;
10. detail link.

Maturity labels:
- Production;
- Conditional;
- Mock;
- Locked.

A Mock employee cannot show a green production “稼働中” badge. Use `MOCK実行中`.

### Employee Detail

Header:
- name;
- role;
- maturity;
- state;
- external execution state;
- primary contextual action.

Overview grid:
- current assignment: 8 columns;
- safety and permission: 4 columns;
- provider state: 4 columns;
- cost: 4 columns;
- recent handoff: 4 columns.

Tabs:
- Overview;
- Tasks;
- Capabilities;
- Cost;
- Audit.

For every capability show:
- input;
- output;
- permission;
- cost;
- failure;
- retry;
- log;
- metrics;
- workflow.
If any field is undefined, the capability is not Production maturity.

## 14.4 Approval List

### Header Summary
- pending;
- expiring within 24 hours;
- high-risk;
- cost-threshold.
These are filters, not decorative KPI cards.

### List Grouping
1. action required;
2. expiring;
3. waiting for revision;
4. completed history.

Each approval row:
- category icon;
- concise title;
- exact target;
- requested capability;
- risk;
- cost ceiling;
- expiry;
- state;
- action.

No swipe-to-approve. No bulk approval in v1.

## 14.5 Approval Detail — Decision Contract

Desktop:
```text
Main decision content: 8 columns
Decision summary panel: 4 columns sticky below topbar
```

Main sections:
1. requested decision;
2. business rationale;
3. exact artifact/snapshot preview;
4. risk and reversibility;
5. provider/execution effect;
6. cost and quota impact;
7. audit metadata.

Sticky panel:
- state;
- expiry;
- exact version;
- cost ceiling;
- external execution result;
- Approve;
- Request revision;
- Reject;
- Hold.

Approval confirmation must repeat:
- exact object/version;
- cost ceiling;
- expiry;
- whether execution occurs.

Canonical statement:
```text
この承認だけでは外部実行は有効になりません。
```

When an approval will enable a separately permitted execution stage, use:
```text
承認後、許可済みの実行工程へ進みます。
現在の外部実行設定: ロック中
```

## 14.6 Operations

Sub-navigation:
- Offers;
- Workflows;
- Activity.

### Offers
Table columns:
- offer;
- stage;
- environment;
- forecast;
- approved artifact;
- next requirement;
- updated.

### Workflows
Cards or table depending count.
Required:
- workflow name;
- employee;
- current step;
- state;
- retry state;
- cost;
- next action;
- updated.

Workflow detail:
- deterministic stepper;
- input and output summary;
- approval gates;
- provider calls;
- failure/retry events;
- audit link.

Do not show a progress percentage unless calculated from explicit finite steps.

## 14.7 Revenue

Top segmented navigation:
- Actual;
- Forecast;
- Evidence;
- Campaigns;
- Records.

### Actual
Hero metric is allowed only for verified Actual.
Include:
- period;
- evidence count;
- recorded timestamp;
- comparison basis.

### Forecast
Blue visual family, persistent `予測` label.
Must show:
- model/rule version when available;
- generated timestamp;
- confidence or range when available;
- assumptions.

### Evidence Queue
Each item:
- source;
- amount claimed;
- currency;
- external date;
- evidence preview;
- verification state;
- conflict;
- Owner decision.

Verification action must not silently create a revenue record if a distinct approval step exists.

### Manual Execution Package
Display:
- package created;
- destination;
- instructions;
- artifact version;
- human execution status if manually recorded;
- evidence state.
Never show “送信済み” from package generation alone.

## 14.8 Insights

Each insight card uses the fixed anatomy:
1. observation;
2. evidence;
3. confidence;
4. implication;
5. recommendation;
6. estimated impact;
7. source state;
8. generated timestamp.

Confidence labels:
- High;
- Medium;
- Low;
- Unknown.
Do not fabricate a numeric confidence score when the system does not produce one.

Charts:
- maximum two primary charts above the fold;
- no more than five series;
- Actual uses dark solid line;
- Forecast uses blue dashed line;
- data gaps remain gaps;
- unknown periods are not interpolated visually.

## 14.9 Integrations

Provider list card:
- official provider name;
- connection;
- authentication;
- read capability;
- write capability;
- global execution state;
- cost/quota;
- health;
- action.

Provider detail overview:
```text
Connection status        6 columns
Capability and locks     6 columns
Usage and quota          4 columns
Cost Guard               4 columns
Health                   4 columns
Recent events           12 columns
```

Connection CTA labels:
- `接続する`
- `再接続する`
- `接続を解除`
No generic `設定`.

Write capability must remain a separate row even if always locked.

## 14.10 Inbox

Inbox item types:
- approval;
- expiry;
- failure;
- provider;
- evidence;
- cost;
- handoff;
- security.

Every item has:
- occurrence timestamp;
- affected object;
- unread/read;
- severity;
- one destination.

Notifications are not deleted by opening. Read state is separate from resolution state.

## 14.11 Audit

Desktop table columns:
- timestamp;
- actor;
- event;
- object;
- state/result;
- provider;
- correlation ID.

Detail drawer:
- human-readable summary first;
- technical metadata second;
- redacted payload third.

Audit must never expose provider token values or service-role material.

## 14.12 Settings

Sections and order:
1. Workspace;
2. Owner Profile;
3. Preferences;
4. Notifications;
5. Cost Policy;
6. Developer Mode;
7. Data Management.

Danger Zone is visually separated and last.

Developer Mode:
- explicit toggle;
- explanation;
- environment warning;
- no effect on backend production safety;
- enables Labs navigation only.

## 14.13 Labs

Every Labs route must:
- use `/labs/*`;
- display persistent Labs banner;
- show its data source;
- avoid canonical production KPIs;
- never write to protected production tables unless the same approved production boundary is used;
- remain lazy-loaded and excluded from the default initial bundle.


# 15. Component Specification Matrix

This matrix defines the mandatory variants and states. Additional variants require design-system review.

## 15.1 Button Matrix

| Variant | Purpose | Background | Border | Text | Allowed for destructive |
|---|---|---|---|---|---|
| Primary | dominant safe action | dark | none | white | No |
| Approval | approval decision | gold-500 | none | dark | No |
| Secondary | alternate action | surface | strong | primary | No |
| Quiet | low emphasis | transparent | none | secondary | No |
| Danger | destructive action | danger-500 | none | white | Yes |
| Link | navigation | transparent | none | contextual | No |
| Icon | compact utility | transparent/surface | optional | primary | Only with label |

Sizes:
- sm: 32px;
- md: 40px;
- lg: 48px.

Button text and icon gap: 8px.
Loading uses inline spinner and `aria-busy=true`.
Disabled opacity alone is insufficient; cursor, semantics, and explanatory text are required.

## 15.2 Card Matrix

| Variant | Use | Padding | Border | Shadow |
|---|---|---:|---|---|
| Surface | normal content | 24 | default | 1 |
| Decision | Owner action | 24 | gold/semantic | 1 |
| KPI | one metric | 20 | default | 0–1 |
| Employee | employee overview | 20 | default | 1 |
| Provider | provider readiness | 20 | default | 1 |
| Approval | approval item | 20 | state | 0 |
| Audit | technical event | 16 | subtle | 0 |
| Warning | persistent warning | 20 | warning | 0 |
| Error | persistent failure | 20 | danger | 0 |
| Empty | no content state | 32 | dashed | 0 |

## 15.3 StatusBadge Registry

Each state has a fixed icon and label family.

| State | Japanese | Icon | Border style |
|---|---|---|---|
| mock | MOCK | FlaskConical | dashed |
| forecast | 予測 | TrendingUp | solid |
| pending | 対応待ち | Clock3 | solid |
| approved | 承認済み | BadgeCheck | solid |
| ready | 実行準備完了 | CircleArrowRight | solid |
| running | 処理中 | Activity | solid |
| partial | 一部完了 | CircleDashed | solid |
| completed | 完了 | CircleCheck | solid |
| evidence_waiting | 証拠待ち | FileSearch | solid |
| actual | 実績 | ShieldCheck | double/strong |
| failed | 失敗 | CircleX | solid |
| expired | 期限切れ | TimerOff | solid |
| locked | ロック中 | Lock | solid |
| unknown | 不明 | CircleHelp | dotted |

## 15.4 Form Field Contract

Every form field component exposes:
- `id`;
- `name`;
- `label`;
- `description`;
- `value`;
- `required`;
- `disabled`;
- `disabledReason`;
- `error`;
- `success`;
- `onChange`;
- `aria-describedby`.

Validation occurs:
- on submit by default;
- on blur after first failed submit;
- not on every keystroke for complex fields.

## 15.5 Modal Contract

Required DOM behavior:
- `role="dialog"` or `alertdialog`;
- `aria-modal="true"`;
- labelled title;
- focus trap;
- return focus;
- body scroll lock;
- Escape behavior;
- click-outside behavior explicitly defined.

Approval and destructive modals do not close from accidental outside click.

## 15.6 Data Table Contract

A table definition must declare:
- row key;
- visible columns;
- sortable columns;
- filterable fields;
- default sort;
- mobile representation;
- empty state;
- loading state;
- error state;
- row action behavior.

## 15.7 Owner Action Queue Contract

Normalized action object:

```js
{
  id,
  type,
  title,
  reason,
  priority,
  state,
  targetType,
  targetId,
  dueAt,
  expiresAt,
  primaryAction,
  source,
  createdAt,
  updatedAt
}
```

Priority enum:
- critical;
- high;
- normal;
- low.

A screen may filter the queue but must not create incompatible action semantics.

## 15.8 Money Display

Money component requires:
- amount;
- currency;
- semantic source (`actual`, `forecast`, `unknown`);
- period;
- locale;
- precision policy.

Rules:
- unknown: `未登録`;
- unavailable: `取得できません`;
- actual zero: `¥0` with Actual source;
- negative: explicit minus;
- currency always visible where ambiguity exists;
- large compact notation provides exact value in accessible label.

## 15.9 Date and Freshness

Every time-sensitive object should expose:
- created;
- updated;
- generated;
- expires;
- verified.
Use absolute date in detail views and relative date optionally in list views.

## 15.10 AI Task Progress

Task progress states:
- queued;
- preparing;
- waiting_for_approval;
- ready;
- running;
- waiting_for_evidence;
- completed;
- failed;
- cancelled.

Required display:
- current step;
- next step;
- blocker;
- cost so far;
- retry status;
- last event.

Never invent hidden chain-of-thought text. Display only stored operational summaries and events.


# 16. Domain-to-UI Contracts

The UI must map domain truth rather than infer it from presentation convenience.

## 16.1 Approval Contract

UI input must be derived from canonical approval records and related immutable snapshots.

Minimum fields:
- approval ID;
- workspace ID;
- target object type and ID;
- artifact/version;
- payload hash;
- requested capability;
- requested by;
- created;
- expiry;
- one-time-use state;
- risk classification;
- cost ceiling;
- decision;
- decided by;
- decided at;
- execution effect.

If snapshot validation cannot be confirmed, approval is blocked and cannot be rendered as safely actionable.

## 16.2 Revenue Contract

Revenue display categories:

```text
Candidate
Forecast
Evidence Waiting
Verified Actual
Reversed/Adjusted Actual
```

The UI must not promote between categories. Promotion occurs only through canonical backend logic.

## 16.3 Provider Contract

Provider display is computed from independent fields:

```text
configured
authenticated
connection_health
granted_scopes
read_capability
write_capability
global_execution_lock
provider_execution_lock
approval_requirement
quota_state
cost_guard_state
last_checked_at
```

A single boolean `connected` is insufficient.

## 16.4 AI Employee Contract

Production employee requires:
- formal registry entry;
- role and scope;
- maturity;
- capability definitions;
- permission boundary;
- provider requirements;
- cost policy;
- failure and retry policy;
- audit behavior;
- metrics;
- workflow binding.

Legacy UI concepts without these fields are Mock or Planned.

## 16.5 Workspace Contract

Every canonical data query and mutation remains workspace scoped.
The UI:
- displays current workspace;
- prevents stale cross-workspace render after a switch;
- invalidates relevant query caches;
- never derives workspace solely from an editable URL parameter.

## 16.6 Cost Guard Contract

A cost state is one of:
- within_limit;
- nearing_limit;
- approval_required;
- blocked;
- unavailable.

Unavailable fails closed for a write/execution action.
The UI shows the exact resolvable condition where possible.

## 16.7 Error Taxonomy

Errors must be normalized into:
- validation;
- authentication;
- authorization;
- workspace;
- approval;
- provider;
- quota;
- cost;
- network;
- conflict;
- unavailable;
- internal;
- unknown.

Each category defines:
- user title;
- safe explanation;
- retry policy;
- action;
- audit/correlation metadata;
- whether external action may have occurred.


# 17. Content and Copy Catalogue

These strings are canonical starting points. Product copy may be refined without changing semantics.

## 17.1 Empty States

### No Actual Revenue
**Title:** 実績はまだ登録されていません  
**Body:** 証拠確認が完了し、正式に記録された売上だけが表示されます。  
**Action:** 証拠待ちを確認

### No Pending Approval
**Title:** 対応が必要な承認はありません  
**Body:** 新しい承認依頼が作成されると、ここに表示されます。

### No AI Employee Activity
**Title:** 現在進行中の業務はありません  
**Body:** AI社員に割り当てられた本番業務はありません。

### Provider Not Connected
**Title:** プロバイダーが接続されていません  
**Body:** 読み取り専用接続から設定できます。外部書き込みは引き続きロックされます。  
**Action:** 接続を設定

### Filtered Empty
**Title:** 条件に一致する項目がありません  
**Body:** フィルターを変更して、もう一度確認してください。  
**Action:** フィルターを解除

## 17.2 Approval Copy

Approve:
```text
この内容を承認しますか？
対象: {object}
バージョン: {version}
費用上限: {cost}
有効期限: {expiry}
外部実行: {effect}
```

Revision:
```text
修正内容を具体的に入力してください。
現在の承認依頼は承認されません。
```

Reject:
```text
この承認依頼を却下します。
却下後の再申請には、新しい承認依頼が必要です。
```

## 17.3 Provider Copy

Read-only connected:
```text
接続済み・読み取り専用
データの取得は可能です。外部への作成・更新・送信はロックされています。
```

Write locked:
```text
書き込み機能はロックされています
OAuth接続だけでは書き込みは有効になりません。
```

Unknown health:
```text
接続状態を確認できません
安全のため、外部操作は実行できません。
```

## 17.4 Cost Copy

Near limit:
```text
費用上限に近づいています
現在の使用額: {used}
上限: {limit}
```

Blocked:
```text
費用上限により停止しました
追加費用の承認が完了するまで実行できません。
```

## 17.5 Failure Copy

No external action:
```text
処理を完了できませんでした
外部操作は実行されていません。
```

External result unknown:
```text
処理結果を確認できません
重複実行を防ぐため、自動再試行は停止しています。監査ログを確認してください。
```


# 18. Accessibility Acceptance Matrix

| Area | Requirement | Verification |
|---|---|---|
| Keyboard | all actions reachable | manual tab test |
| Focus | visible 3:1 focus indicator | visual + automated |
| Headings | one logical H1 and ordered hierarchy | DOM audit |
| Landmarks | header/nav/main/aside/footer | screen reader |
| Forms | persistent labels and linked errors | axe + manual |
| Modal | trap, Escape policy, return focus | integration test |
| Status | icon/text, not color only | visual audit |
| Contrast | WCAG 2.2 AA | automated contrast test |
| Motion | reduced-motion respected | OS preference test |
| Tables | headers and scope | screen reader |
| Charts | textual summary | DOM audit |
| Toast | polite/assertive live region by severity | screen reader |
| Mobile | 44px touch targets | device test |
| Zoom | usable at 200% | browser test |
| Reflow | no loss at 320 CSS px | browser test |
| Language | `lang="ja"` and English spans where useful | DOM audit |


# 19. Performance and Bundle Plan

## 19.1 Mandatory Route Splitting

Separate chunks:
- shell/auth;
- home;
- approvals;
- operations;
- revenue;
- insights/charts;
- employees;
- integrations;
- audit;
- settings;
- Labs.

No Labs module is imported synchronously by the production shell.

## 19.2 Dependency Policy

Before adding a dependency, record:
- purpose;
- current alternative;
- compressed size;
- tree-shaking behavior;
- security/maintenance status;
- accessibility impact.

Preferred:
- native CSS;
- existing React;
- lucide-react;
- existing Supabase;
- small utility functions.

Avoid:
- full UI frameworks;
- duplicate date libraries;
- duplicate chart libraries;
- animation frameworks for basic transitions;
- icon packs beyond the selected set.

## 19.3 Runtime Rules

- Abort stale requests on route change where appropriate.
- Cache safe read data deliberately.
- Invalidate after canonical mutations.
- Avoid polling faster than business need.
- Provider health may use explicit refresh or conservative intervals.
- Do not render more than 100 audit rows without pagination or virtualization.
- Use skeletons that match final layout to avoid CLS.


# 20. Testing and Acceptance

## 20.1 Required Test Layers

- semantic state and formatter unit tests;
- component accessibility and interaction tests;
- repository integration tests;
- route/auth/workspace tests;
- production-vs-Labs isolation tests;
- critical E2E Owner journeys;
- visual regression for canonical routes;
- bundle and mojibake checks.

## 20.2 Critical E2E Flows

1. Owner login → Home with verified workspace.
2. Home action → Approval detail → approve exact snapshot.
3. Approval result confirms external execution remains locked.
4. Evidence waiting → verification → Actual revenue record.
5. Provider connected read-only → write remains locked.
6. AI Employee dry run → no external provider write.
7. Workspace mismatch → data and action blocked.
8. Cost threshold → approval required.
9. Developer Mode off → Labs absent from navigation and route guarded.
10. Deep link refresh and browser history work.
11. Unknown revenue displays `未登録`, verified zero displays `¥0`.
12. Expired approval cannot be approved.
13. Used approval cannot be reused.
14. Provider result unknown prevents automatic duplicate retry.
15. Reduced-motion removes non-essential animation.

## 20.3 Visual Regression Viewports

- 1440×900;
- 1280×800;
- 1024×768;
- 768×1024;
- 390×844;
- 360×800.

Required routes:
- Home;
- Approval list/detail;
- Revenue Actual/Evidence;
- AI Employee list/detail;
- Integrations list/detail;
- Empty states;
- Error/blocked states;
- Labs banner.

## 20.4 Definition of Done

A production route is complete only when:
- canonical data source is documented;
- all states are implemented;
- loading, empty, blocked, error, and success states exist;
- responsive behavior passes;
- keyboard and focus behavior passes;
- copy is reviewed;
- no Mock leakage exists;
- audit behavior remains intact;
- bundle impact is recorded;
- tests pass;
- no architecture constraint is weakened.


# 21. Migration and Delivery Plan

## Stage 0 — Baseline and Guardrails
Deliverables:
- build/test report;
- current route/component inventory;
- Mock vs Production inventory;
- bundle report;
- screenshot baseline;
- architecture invariants test list.

Exit:
- existing baseline reproducible;
- no implementation change merged.

## Stage 1 — Shell, Router, Tokens
Deliverables:
- URL routing;
- auth protection;
- app shell;
- design tokens;
- semantic state registry;
- feature flags;
- 404 route.

Exit:
- legacy views still reachable behind mapped routes;
- no canonical behavior changed;
- build/tests pass.

## Stage 2 — Shared Components
Deliverables:
- primitives and patterns;
- accessibility tests;
- component preview under Labs.

Exit:
- canonical screens can be implemented without ad hoc UI primitives.

## Stage 3 — Home and Approvals
Reason:
These establish the Owner decision model and approval semantics.

Exit:
- Home uses canonical data;
- approval exact snapshot flow passes E2E;
- no execution implication.

## Stage 4 — Revenue and Operations
Exit:
- Actual/Forecast/Evidence separation passes;
- offers/workflows use canonical repositories;
- unknown/zero tests pass.

## Stage 5 — Employees and Integrations
Exit:
- formal employee maturity shown;
- Google Operations remains Dry Run;
- provider state ladder shown;
- write locks remain visible.

## Stage 6 — Insights, Inbox, Audit, Settings
Exit:
- actionable event model;
- audit redaction;
- Developer Mode control;
- cost policy presentation.

## Stage 7 — Labs Separation
Exit:
- all localStorage/Mock concepts moved;
- production nav contains seven primary modules;
- Labs excluded from production metrics and initial bundle.

## Stage 8 — Hardening
Deliverables:
- accessibility report;
- bundle comparison;
- responsive report;
- visual regression;
- final architecture verification;
- migration notes.

## Merge Policy
Each stage is independently reviewable and reversible.
Do not merge a large rewrite that combines routing, styling, repository changes, and domain behavior.


# 22. Implementation Acceptance Matrix

| ID | Requirement | Priority | Evidence |
|---|---|---:|---|
| UI-001 | Production has seven primary nav items | P0 | screenshot/test |
| UI-002 | URL routing and deep links work | P0 | E2E |
| UI-003 | Labs hidden by default | P0 | E2E |
| UI-004 | Mock cannot appear as Actual | P0 | unit/E2E |
| UI-005 | Forecast is persistently labelled | P0 | visual test |
| UI-006 | Unknown differs from zero | P0 | unit/E2E |
| UI-007 | Approval differs from execution | P0 | E2E |
| UI-008 | Provider connection differs from permission | P0 | integration |
| UI-009 | External Execution remains false | P0 | architecture verification |
| UI-010 | Workspace boundary preserved | P0 | integration |
| UI-011 | Cost Guard fail-closed preserved | P0 | integration |
| UI-012 | Credentials never exposed | P0 | security review |
| UI-013 | Approval snapshot/hash/expiry/use preserved | P0 | integration |
| UI-014 | Evidence required for Actual | P0 | E2E |
| UI-015 | Google Operations remains Dry Run | P0 | integration |
| UI-016 | WCAG 2.2 AA baseline | P1 | audit |
| UI-017 | Reduced motion supported | P1 | test |
| UI-018 | Mobile navigation defined | P1 | visual/E2E |
| UI-019 | Initial bundle route-split | P1 | bundle report |
| UI-020 | Mojibake eliminated | P1 | automated scan |
| UI-021 | Audit details redacted | P0 | integration |
| UI-022 | Reset copy is accurate | P1 | review |
| UI-023 | No new global UI framework | P1 | dependency diff |
| UI-024 | Current build/tests remain green | P0 | CI |


# 23. Governance, Decisions, and Deferred Scope

## 23.1 Mandatory ADRs

Create an Architecture Decision Record for:
- router selection;
- chart solution;
- query/cache strategy if introduced;
- TypeScript migration if introduced;
- global state library if introduced;
- any major UI framework;
- any change to provider execution semantics.

## 23.2 Release Naming

This document is `v1.0 RC1`.

It becomes `v1.0 Final` only after:
1. development acknowledges architecture assumptions;
2. repository paths and canonical data contracts are verified against the live codebase;
3. no blocking contradiction is found;
4. Owner approves any necessary corrections;
5. acceptance matrix is attached to the implementation issue.

No visual or UX section remains intentionally undefined for the v1 scope.
Repository-specific identifiers may still require confirmation by the development team.

## 23.3 Deferred Scope

Explicitly deferred:
- dark mode;
- white-label themes;
- organization hierarchy;
- employee creation marketplace;
- automated external write execution;
- scheduler/worker infrastructure;
- Storybook requirement;
- complete TypeScript conversion;
- ornamental brand illustration library;
- advanced custom dashboard builder.

Deferred does not mean prohibited. It means it is outside v1 acceptance.


# 24. Final Release Checklist

### Architecture
- [ ] Owner-only access preserved.
- [ ] Workspace boundary preserved.
- [ ] RLS and protected RPC boundaries preserved.
- [ ] Approval snapshots remain immutable and exact.
- [ ] Approval expiry and one-time use preserved.
- [ ] Evidence is required for Actual.
- [ ] Cost Guard remains fail-closed.
- [ ] Provider credentials remain server-only.
- [ ] External Execution remains false.
- [ ] Google Operations remains Dry Run.

### Product Semantics
- [ ] Mock, Forecast, Approved, Ready, Executed, and Actual are distinct.
- [ ] Unknown and zero are distinct.
- [ ] Connection and permission are distinct.
- [ ] Package creation and delivery are distinct.
- [ ] Approval and execution are distinct.

### UI
- [ ] Seven-item production navigation.
- [ ] URL routing and deep links.
- [ ] Labs separation.
- [ ] Shared tokens and components.
- [ ] All canonical screen states.
- [ ] Responsive layouts.
- [ ] Accessible keyboard/focus behavior.
- [ ] Reduced motion.
- [ ] No mojibake.
- [ ] No uncontrolled visual effects.

### Engineering
- [ ] Existing tests pass.
- [ ] New critical tests pass.
- [ ] Bundle report produced.
- [ ] Labs excluded from initial bundle.
- [ ] No credential leakage.
- [ ] Audit regression checks pass.
- [ ] Migration notes complete.
- [ ] Known limitations documented.


# Appendix A — Canonical Enums

```js
export const UI_STATE = Object.freeze({
  MOCK: "mock",
  FORECAST: "forecast",
  CANDIDATE: "candidate",
  PENDING: "pending",
  APPROVED: "approved",
  READY: "ready",
  RUNNING: "running",
  PARTIAL: "partial",
  COMPLETED: "completed",
  EVIDENCE_WAITING: "evidence_waiting",
  ACTUAL: "actual",
  FAILED: "failed",
  CANCELLED: "cancelled",
  EXPIRED: "expired",
  LOCKED: "locked",
  UNKNOWN: "unknown",
});

export const MATURITY = Object.freeze({
  PRODUCTION: "production",
  CONDITIONAL: "conditional",
  MOCK: "mock",
  LOCKED: "locked",
});

export const ENVIRONMENT = Object.freeze({
  PRODUCTION: "production",
  SANDBOX: "sandbox",
  DRY_RUN: "dry_run",
  MOCK: "mock",
  LOCKED: "locked",
});

export const COST_STATE = Object.freeze({
  WITHIN_LIMIT: "within_limit",
  NEARING_LIMIT: "nearing_limit",
  APPROVAL_REQUIRED: "approval_required",
  BLOCKED: "blocked",
  UNAVAILABLE: "unavailable",
});
```


# Appendix B — Repository Verification Questions

The development team must answer these against the current repository before implementation begins:

1. Which repository/service is canonical for Home metrics?
2. Which approval table/RPC is canonical for revenue approval?
3. Which exact fields expose payload hash, artifact version, expiry, and one-time use?
4. Which repository returns evidence-waiting and verified Actual records?
5. Which provider readiness data is canonical and which is local Mock?
6. Where is the global External Execution flag enforced?
7. Where are provider-specific write locks enforced?
8. Which Cost Guard result shape is canonical?
9. Which audit event source is canonical?
10. Which legacy routes/components are still imported by the initial bundle?
11. Which Mock screens write localStorage?
12. Are any screens writing protected tables directly from the browser?
13. What is the current compressed initial bundle and route chunk composition?
14. What mojibake strings remain?
15. Which migrations 003–012 define current UI-relevant contracts?

Answers should update implementation mappings, not weaken this specification.
