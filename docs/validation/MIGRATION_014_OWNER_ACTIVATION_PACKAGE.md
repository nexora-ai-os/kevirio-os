# Migration 014 Owner Activation Package

Status: FINAL RELEASE CANDIDATE / Not Applied

## Frozen artifact

- Migration: `supabase/migrations/014_affiliate_intelligence.sql`
- Expected SHA-256: `47B84532D42C327B7A59424062E7E71FB00C1338CA94F2555FFC02CB49B99F10`
- Pre-check: `supabase/validation/014_pre_apply_checks.sql`
- Post-smoke: `supabase/validation/014_post_apply_smoke.sql`
- Parser evidence: `@pgsql/parser` 1.5.0, PostgreSQL 17/libpg_query `170004`
- Saved-artifact statements: Migration 21; Pre-check 3; Post-smoke 3

The SHA is calculated from the saved UTF-8 Migration file, not an in-memory reformatted representation. Before any Production apply, independently calculate SHA-256 again and compare it exactly with the value above and the `freeze` row returned by Pre-check.

## Scope

Migration 014 adds four Affiliate Intelligence tables, four explicit read indexes, one updated-at trigger function, three triggers, one Owner-scoped Draft RPC, four Owner read policies, and explicit browser privilege boundaries. Existing Offer, Approval, Execution Package, Evidence, Revenue, Cost and Content remain canonical and are not seeded or mutated. External Execution remains false.

## Owner-controlled sequence

1. Confirm Production backup/PITR and a named recovery target.
2. Confirm the saved Migration SHA-256 exactly matches the frozen value above. STOP on mismatch.
3. Run `014_pre_apply_checks.sql` without modification.
4. Inspect the complete Result Set. Continue only when `overall_status=PASS`, `fail_count=0`, `READ_ONLY_ROLLBACK`, and `M014_PRE_APPLY_CHECKS_PASS` are present. STOP on every FAIL or unexpected result.
5. Under a separate explicit Owner approval, run `014_affiliate_intelligence.sql` exactly once. Do not re-run after an ambiguous or partial result.
6. Run `014_post_apply_smoke.sql` without modification.
7. Inspect the complete Result Set. Accept only when `overall_status=PASS`, `fail_count=0`, `READ_ONLY_ROLLBACK`, `external_execution=LOCKED`, and `M014_POST_APPLY_SMOKE_PASS` are present.
8. Only after database validation, use Owner UI to link the existing RingConn Offer to the A8.net Affiliate Program. Migration seed is prohibited.

## Expected outputs

Pre-check returns one aggregated Result Set containing PASS/FAIL/WARN rows plus:

- `pass_count`
- `fail_count=0`
- `warn_count`
- `overall_status=PASS`
- `M014_PRE_APPLY_CHECKS_PASS`
- the frozen Migration SHA

Post-smoke returns one aggregated Result Set covering tables, columns, types, defaults, nullability, constraints, FK, indexes, functions, search path, privileges, RLS, policies, triggers, External Execution and Workspace isolation, plus:

- `pass_count`
- `fail_count=0`
- `warn_count`
- `overall_status=PASS`
- `READ_ONLY_ROLLBACK`
- `external_execution=LOCKED`
- `M014_POST_APPLY_SMOKE_PASS`

## Exact STOP conditions

- Saved Migration SHA mismatch
- Any Pre-check or Post-smoke `FAIL`
- Missing or ambiguous Summary row
- Parent, function, table, constraint, index, trigger or policy collision
- Ownership mismatch
- Partial schema detected
- RLS disabled or active Owner predicate mismatch
- anon privilege or authenticated direct table mutation privilege
- RPC privilege/search-path/security-mode mismatch
- Workspace composite FK or isolation mismatch
- Any row or schema path with `external_execution_allowed=true`
- Existing RingConn Offer missing or changed
- Any credential, session, tracking secret or raw provider payload exposure
- Apply result is ambiguous, interrupted or repeated

## Rollback / recovery

Pre-check and Post-smoke are read-only transactions ending in `ROLLBACK`. Before apply, recovery is simply to STOP and not run Migration 014. After apply, do not improvise destructive SQL and do not alter Migration 001–014 in place. Stop application mutations, keep External Execution LOCKED, preserve database and deployment evidence, and restore only through the Owner-approved backup/PITR recovery procedure. Existing Offer, Approval, Evidence, Revenue, Cost, Content and Execution records must not be deleted or rewritten.
