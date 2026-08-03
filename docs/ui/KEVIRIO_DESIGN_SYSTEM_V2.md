# KEVIRIO Owner UI Design System V2.0

## Status

- Scope: Production Owner UI presentation only
- Governance: KEVIRIO Governance V2.1
- Source of truth: Owner-approved visual direction and current production contracts
- Browser acceptance: Pending validation
- Business behavior: Unchanged

## Audit findings

The pre-V2 implementation had a valid light brand foundation, route-level lazy loading, shared components, truthful production repositories, and explicit Actual/Mock/Locked boundaries. The remaining UI problems were:

- Production content was bounded at 1440px while the shell allowed wider space, leaving wide desktops underused.
- `src/styles.css`, shell CSS, Design System CSS, and Production screen CSS contained overlapping `.sidebar`, `.topbar`, `.nav`, `.content`, `.eyebrow`, Card, spacing, and color rules.
- Legacy green/mint variables remained reachable through old global selectors even though the approved Owner identity is white/champagne gold/silver/soft blue/pale purple.
- Page headers, cards, empty states, KPI cards, and boundaries had insufficient role differentiation.
- Mobile navigation exposed only five destinations in a fixed bottom bar; utility destinations were hidden.
- The authenticated state appeared as a raw `Owner session verified` banner outside the shell.
- Approvals retained English-first primary copy.
- Inbox and Settings used generic Empty State even though their correct maturity is Locked/Not Implemented.
- The semantic registry lacked No Match, Waiting, Queued, Disabled, Offline, Unconnected, and Verified.

## Token architecture

`src/design-system/tokens.css` is the single source for:

- Brand and semantic colors
- Font family, size, weight, line height, and letter spacing
- Spacing and grid gaps
- Reading, standard, wide, and full workspace widths
- Radius, border, shadow, elevation, blur, and opacity
- Icon size
- Motion and transition timing
- Focus ring
- Z-index
- Breakpoint contracts

Screen-level CSS may arrange domain-specific content but must consume these shared tokens. It must not introduce a competing palette or duplicate a shared component.

## Visual system

- Foundation: White and Warm White
- Brand accent: Champagne and Deep Gold
- Supporting intelligence: Soft Blue and Pale Purple
- Structure: Soft Silver borders and inset surfaces
- Text: Deep Ink and Muted Slate
- Operational states: Success Green, Warning Amber, Error Red, Locked Gray

Gold is reserved for Owner actions, active navigation, verified milestones, K identity, and restrained edge highlights. It is not used for body copy or every surface.

## Surface hierarchy

1. Application background
2. Navigation surface
3. Page Hero
4. Primary Owner Action
5. KPI surface
6. Standard content surface
7. Inset surface
8. Floating Owner menu
9. Alert surface
10. Locked surface

## Page archetypes

| Screen | Archetype | Primary purpose |
| --- | --- | --- |
| Home | Command Dashboard | Company state and one next Owner action |
| AI Employees | Entity/Workforce Control | Role, permission, maturity, task and boundary |
| Approvals | Review Queue | Exact-snapshot Owner decisions |
| Operations | Operational Workspace | Offer-to-evidence lifecycle |
| Revenue | Wide Data Workspace | Revenue truth, Evidence, Approval, Cost and Profit |
| Insights | Analytical Dashboard | Evidence-backed analytics readiness and results |
| Integrations | Integration Directory | Connection, permission, cost and execution boundary |
| Inbox | Locked State | Purpose, alternative and unlock requirements |
| Audit | System Control / Records | Append-only activity and safe failure state |
| Settings | System Control | Current policy, authority and change boundary |

## State system

Each state has a text label, non-color cue, tone, border treatment, and explicit action policy. The canonical registry includes Mock, Forecast, Candidate, Pending, Approved, Ready, Running, Partial, Completed, Evidence Waiting, Actual, Failed, Cancelled, Expired, Locked, Unknown, Empty, No Match, Waiting, Queued, Disabled, Offline, Unconnected, and Verified.

- Unknown is not zero, Empty, or Failure.
- Locked explains the reason, what remains possible, and the unlock requirement.
- Unavailable identifies missing Repository, Provider, permission, or external environment.
- Actual requires the existing Evidence contract.
- Mock and Forecast remain visibly and semantically separate from Actual.

## Responsive system

- `1920px+`: full workspace token; wide data screens use 12-column composition.
- `1440–1919px`: wide/standard dashboard width with four-column KPI grid where content permits.
- `1025–1439px`: desktop Sidebar with responsive content grid.
- `601–1024px`: Sidebar becomes an accessible Drawer; content and topbar use tablet spacing.
- `≤600px`: compact topbar, Drawer navigation, single-column state/readiness layouts, and touch-safe controls.
- `≤390px`: KPI and export actions become single column.

Target validation viewports: 2560×1440, 1920×1080, 1600×900, 1440×900, 1366×768, 1280×800, 1024×768, 768×1024, 390×844, and 375×812.

## Component inventory

### V2 shared and in Production use

ApplicationShell, Sidebar, Topbar, Owner Menu, PageHeader/Page Hero, PageSection, SystemBoundary, DataReadiness, Button, Badge/Truth Badge, Environment Badge, Card, KpiCard, OwnerActionItem, AIEmployeeCard, ApprovalCard, ProviderCard, EmptyState, NoMatchState, ErrorState, LockedState, UnavailableState, LoadingState, Skeleton, Form controls, Modal, Money, Table, and Timeline.

### Intentional non-components

- Toast: no canonical Production use currently requires it.
- Charts: no verified dataset should be fabricated to demonstrate a chart.
- Persistent collapsed desktop Sidebar: not required for the present navigation density; mobile Drawer is implemented.

## Accessibility contract

- Native landmarks and document focus order
- Skip link to main content
- Visible shared focus treatment
- Native button, details/summary, form and table semantics
- Drawer Escape close and backdrop close
- Owner menu accessible name
- Loading/error/status live semantics
- 44px minimum interactive target; primary actions use 48px where applicable
- Reduced-motion override
- State labels never rely on color alone

## Migration and legacy CSS

Production V2 styles are layered through Design System tokens/components and the bounded `ProductionScreens.css` archetype layer. Legacy modules remain in `src/styles.css` because they are still imported by historical, non-Production components and deleting them without a complete reachability proof would create unrelated risk. Production selectors explicitly override legacy green/mint rules. Further deletion is not part of this UI change unless source reachability and browser evidence prove it safe.

## Architecture verification

The UI migration does not change authentication architecture, `signInWithPassword`, Owner verification, session handling, repositories, RLS, protected RPCs, database, migrations, Approval semantics, Evidence semantics, Actual Revenue, Cost Guard, Provider contracts, Workspace isolation, Audit behavior, External Execution, or Google Operations Dry Run.
