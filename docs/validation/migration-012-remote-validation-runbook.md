# Migration 012 Remote Validation Runbook

Status: Owner-operated, Production mutation prohibited during validation. Local PostgreSQL runtime validation was not performed.

## Before apply

1. Confirm the remote migration ledger contains 003 through 011 and not 012.
2. Run `supabase/validation/012_pre_apply_checks.sql` in the Supabase SQL Editor. It is a read-only transaction and ends with `ROLLBACK`.
3. Require `M012_PRECHECK_PASS`. Any missing baseline or partial 012 schema is a stop condition.
4. Export a schema-only backup through the approved Supabase workflow. Do not copy credential values into validation artifacts.
5. Review the exact SHA-256 hash of `012_ai_employee_platform.sql` against the approved release artifact.

## Apply

Only the Owner may apply `012_ai_employee_platform.sql`. Do not enable Global or Provider switches. The migration is transaction-wrapped. A statement failure rolls back the complete migration. Do not create Migration 013 to conceal a failed first application.

## Immediate read-only smoke

Run `supabase/validation/012_post_apply_smoke.sql`. It verifies inventory, RLS, policies, SECURITY DEFINER/search_path, grants, protected RPC execute boundaries, event immutability and the Conditional/locked Google Operations definition. It performs no data or schema mutation and ends with `ROLLBACK`.

## Workspace and RLS evidence

Use two dedicated non-Production validation workspaces and two dedicated test Owner identities in a staging clone. Never use real Production business records as fixtures. Verify A reads only A and B reads only B for task, event, handoff, quota and binding tables. Verify inactive membership reads zero rows. Verify `anon` reads zero rows. Verify `authenticated` cannot insert, update or delete and cannot execute protected RPCs.

## RPC, race and replay evidence

Run only in a staging clone with disposable fixtures. Open two independent database connections and synchronize calls at a barrier. Verify exactly one concurrent transition succeeds, exactly one Approval consume succeeds, quota totals never exceed the policy, duplicate idempotency returns the same logical result, stale transitions fail, Approval reuse across task/workspace/capability fails, and event mutation fails. Roll back or delete the dedicated staging workspace after evidence collection.

## Raw-content evidence

In staging, submit top-level, nested, array, mixed-case, snake_case and camelCase variants for body, prompt, token, credential, provider raw response and raw error fields. Include excessive depth, oversized JSON and token-like values. All must fail. Safe IDs, hashes, counts, timestamps, normalized status and short summaries must pass.

## Quota evidence

In staging, test call and YouTube unit policies separately across daily, task, workflow, service, capability and concurrency limits. Verify finalize/release terminal-state rules, expiry, orphan eligibility, retry accounting and timezone-derived usage date. Unknown or disabled policy must fail closed.

## Stop conditions

- Any cross-workspace read or mutation succeeds.
- `anon` or `authenticated` gains mutation or protected RPC execution.
- Approval snapshot mismatch or replay succeeds.
- Concurrent quota reservations exceed a declared limit.
- raw content or credential-like metadata is accepted.
- any External Execution, OAuth authorization or provider request occurs.

Production mutation-based race/RLS tests are intentionally prohibited. They must run in a staging clone; the Production smoke is catalog/read-only only.

## Activation record — 2026-08-03

Owner reported Production verification, pre-check PASS, Migration 012 SUCCESS, and corrected read-only post-apply smoke PASS with `Success. No rows returned`. Migration 012 was not re-run and the smoke made no schema changes. Future validation is read-only; do not reapply Migration 012.