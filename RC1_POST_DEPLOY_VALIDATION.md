# KEVIRIO RC1 Post-Deploy Validation

Run against the approved Vercel Preview only. Record URL, commit SHA, browser/version, date and operator. Do not bypass Owner authentication.

## Authentication and security

- [ ] Unauthenticated access does not reveal Production screens.
- [ ] Valid active Owner authentication succeeds.
- [ ] Inactive/non-Owner access fails closed.
- [ ] No credential, token or raw provider error appears in UI, response or console.
- [ ] External Execution displays locked and Google Operations displays Dry Run.
- [ ] `/labs/components` returns 404 when Developer Mode is disabled.

## Routes

- [ ] `/` redirects to `/home`.
- [ ] Home `/home`.
- [ ] AI Employees `/employees` and an employee deep link.
- [ ] Approvals `/approvals`.
- [ ] Operations `/operations` and `/operations/offers`.
- [ ] Revenue `/revenue` and registered Revenue deep links.
- [ ] Insights `/insights`.
- [ ] Integrations `/integrations`.
- [ ] Inbox `/inbox`.
- [ ] Audit `/audit`.
- [ ] Settings `/settings`.
- [ ] Browser back/forward navigation.
- [ ] Direct refresh of a deep link.
- [ ] Unknown path returns the authenticated 404 UI.

## UI and accessibility

- [ ] One `h1` and logical heading order per screen.
- [ ] Skip link becomes visible on focus and moves focus to main content.
- [ ] Complete keyboard navigation and logical tab order.
- [ ] Visible focus indicator on every interactive element.
- [ ] Loading, empty, error, alert and disabled-reason announcements.
- [ ] Tables retain headers/labels in responsive presentation.
- [ ] 320 px viewport and 200% zoom do not lose content or actions.
- [ ] Reduced-motion preference suppresses nonessential animation.
- [ ] Desktop, tablet and mobile screenshots captured for all ten screens.

## Data truth and behavior

- [ ] Unknown is not displayed as zero.
- [ ] Forecast is never displayed as Actual.
- [ ] Actual requires verified Evidence and Approval.
- [ ] Approval uses the exact snapshot and does not optimistically complete.
- [ ] Inbox shows the truthful unconnected state.
- [ ] Audit shows only Workspace-scoped, redacted records.
- [ ] Settings contains no unsupported working controls.
- [ ] Integrations exposes no credential value and does not imply operational readiness.

## Performance and console

- [ ] Initial and route chunks load on demand.
- [ ] Labs chunk does not load during Production navigation.
- [ ] No unexpected repeated repository request.
- [ ] No console error, unhandled rejection, CSP/CORS error or failed asset.
- [ ] No raw JS chunk above 500 kB in the deployed build.

Current status before Preview: **BLOCKED** because commit/push/Preview and authenticated browser environment are not yet approved/available.
