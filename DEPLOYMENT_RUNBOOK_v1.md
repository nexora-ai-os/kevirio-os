# KEVIRIO V1 Deployment Runbook

## Scope

This runbook deploys the frozen KEVIRIO V1 candidate. It adds no feature, architecture, Provider, workflow or migration after 013.

Commit, push, tag, Migration 013 application and deployment each require explicit Owner authority.

## Preconditions

1. Full repository regression is PASS.
2. Working tree is reduced to the intended release set and reviewed.
3. Migration 013 saved-file SHA is `B5DE02C52806E30F76565C9045C9E4E7FD9CCC5365973C746AB7EF6F563365BB`.
4. External Execution, Global switch and Provider switches remain false.
5. The previous known-good deployment identifier is recorded.
6. Production secrets are configured only through the approved hosting environment and are never printed.

## Database activation

1. Owner visually confirms the intended Production Supabase project.
2. Run `supabase/validation/013_pre_apply_checks.sql` in full.
3. Require exactly:
   - `M013_PRECHECK_PASS`
   - `NOT_APPLIED_READY`
   - the frozen SHA
   - `transaction_read_only = true`
4. Stop on any mismatch, error, absent row, partial state or uncertain project.
5. Verify the local saved Migration 013 SHA again.
6. Run `supabase/migrations/013_company_operating_cycle.sql` exactly once.
7. If the client or network result is ambiguous, stop. Do not rerun.
8. After an unambiguous commit, run `supabase/validation/013_post_apply_smoke.sql` in full.
9. Require the exact PASS row, eight tables, six definitions, External Execution LOCKED and READ_ONLY_ROLLBACK.

## Application deployment

1. Owner approves the exact release commit scope.
2. Create the release commit only after all release files and generated assets are reviewed.
3. Owner separately approves push.
4. Push the frozen commit.
5. Owner separately approves Production deployment.
6. Deploy the exact frozen commit using the existing Vercel project configuration.
7. Do not modify environment values during deployment unless separately approved.
8. Keep Global and Provider execution switches false.

## Health check

Immediately after deployment verify:

- `/api/status` returns its safe status contract without secrets.
- Owner login succeeds once and verifies active Owner status.
- Session reload and logout succeed.
- All ten Production routes load.
- No page error, unhandled rejection, critical request failure or unexpected 404 occurs.
- No credential-like value, raw UUID, Mock-as-Actual value or Unknown-as-zero value is rendered.
- Workspace context is unambiguous.
- Approvals, Revenue and Operations read their canonical repositories.
- Inbox and Settings remain truthfully locked.
- External Execution remains LOCKED.
- Global and Provider switches remain false.

## Release verification

Run or retain evidence for:

- Production build.
- Unit, integration and E2E suites.
- Migration 013 post-smoke.
- Authenticated browser routes.
- Accessibility and reduced motion.
- Desktop, tablet and mobile responsive checks.
- Console and network review.
- Credential Boundary and Credential Exposure.
- Production data-truth checks.

## Monitoring

During the first 24 hours monitor:

- Authentication failures by sanitized class only.
- API 5xx and timeout rates.
- Supabase/RLS authorization failures.
- Approval and Evidence workflow failures.
- Cost Guard reservations, usage ledger and circuit state.
- Provider state without credential values.
- External Execution state; any non-false value is a release incident.
- Actual Revenue creation only through verified Evidence and Approval.

## Rollback

### Application failure

1. Stop new Owner operations.
2. Roll traffic back to the previous known-good deployment.
3. Do not revert or edit applied migrations.
4. Verify login, canonical reads and External Execution lock on the restored deployment.

### Migration failure before commit

The transaction rolls back. Record the exact error and stop.

### Migration result is ambiguous

Do not rerun. Execute only authorized read-only catalog verification to determine whether commit occurred.

### Failure after confirmed Migration 013 commit

Do not drop, rename, rewrite or manually repair Production. Keep the application on the compatible known-good deployment and prepare an Owner-reviewed recovery decision. Migration 014 is prohibited under the V1 freeze.

## Failure recovery

- Authentication: follow the human-error-first login diagnostic without exposing credentials.
- Database authorization: verify Owner profile, Workspace membership and RLS evidence; do not bypass policies.
- Approval/Evidence: preserve the immutable snapshot and retry only through documented protected commands.
- Provider/Cost: fail closed, release reservations where supported, and keep execution disabled.
- Revenue discrepancy: stop Actual recording, preserve Evidence and audit records, and reconcile by currency and source reference.

## Completion

Deployment is complete only when Production health, authenticated browser validation, Migration 013 smoke, data truth and External Execution lock all pass against the deployed commit.
