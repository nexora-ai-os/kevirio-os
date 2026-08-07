# Migration 013 Owner Activation Package

Date: 2026-08-03
Status: APPLIED / VERIFIED - retained Owner-reported historical evidence

Repository canonical SHA authority is the SHA-256 of the exact Git-blob bytes for supabase/migrations/013_company_operating_cycle.sql: B5DE02C52806E30F76565C9045C9E4E7FD9CCC5365973C746AB7EF6F563365BB. The Windows CRLF checkout SHA 3B8E361248D3DA6EC5EDD20700BD3FA67D5C6E267FC8E23EE8BC97E9A5B8DE7F is non-authoritative checkout metadata, not Production evidence. This repository-only reconciliation did not access original Production bytes, execute SQL, modify Production, or reapply Migration 013. The validation contract remains read-only and rollback-bounded.
Candidate SHA-256: `B5DE02C52806E30F76565C9045C9E4E7FD9CCC5365973C746AB7EF6F563365BB`

## Authority boundary

Only the Owner may apply Migration 013 to Production. Codex has not applied it, changed Production objects, modified Production data, exposed secrets, authorized OAuth, called an external Provider, enabled External Execution, or enabled Global/Provider switches.

The Owner must visually confirm that Supabase SQL Editor is connected to the intended Production project. No repository artifact can determine the active SQL Editor project.

## Fixed artifacts

1. `supabase/validation/013_pre_apply_checks.sql`
2. `supabase/migrations/013_company_operating_cycle.sql`
3. `supabase/validation/013_post_apply_smoke.sql`
4. `docs/validation/migration-013-remote-validation-runbook.md`

Use each SQL file in full and unchanged. Do not paste partial statements. Do not substitute a previously copied candidate.

## Exact execution order

1. Confirm the intended Production project in Supabase SQL Editor.
2. Run the complete pre-check file.
3. Require exactly one result row containing:
   - `M013_PRECHECK_PASS`
   - `NOT_APPLIED_READY`
   - `B5DE02C52806E30F76565C9045C9E4E7FD9CCC5365973C746AB7EF6F563365BB`
   - `transaction_read_only = true`
4. Stop on any SQL error, no row, partial schema, a different state, a different SHA, or an uncertain project.
5. Verify the local migration file SHA-256 is exactly the fixed candidate SHA.
6. Run the complete Migration 013 file once.
7. Do not re-run after any ambiguous network or client result. Record the exact result and stop.
8. After an unambiguous migration success, run the complete post-apply smoke file.
9. Require exactly one result row containing:
   - `M013_POST_APPLY_SMOKE_PASS`
   - `table_count = 8`
   - `revenue_engine_definition_count = 6`
   - External Execution `LOCKED`
   - execution mode `READ_ONLY_ROLLBACK`
10. Stop and report the exact output. Do not create Migration 014 or alter Production objects to conceal a failed check.

## Expected effect

Migration 013 adds eight Company Operating System tables, including the isolated `revenue_learning_records` table. It does not alter the Migration 003 `business_memory_records` table. It also adds six deterministic and locked Revenue Engine definitions, workspace-scoped RLS read policies, a service-role-only Revenue Engine registration RPC, append-only operating events, updated-at triggers, and the Manual Execution Package contract trigger. It may add missing composite unique constraints to `brand_profiles` and `offer_operations`.

## Expected non-effect

It does not execute a Provider, publish content, authorize OAuth, create Actual Revenue, consume Approval, mutate existing Production business rows, enable External Execution, enable Global/Provider switches, or grant browser mutation access. Existing Manual Execution Packages are not backfilled.

## Verification limitation

Local PostgreSQL execution was intentionally not performed under the Owner's Windows-native validation decision. Static and contract checks pass, but the first actual PostgreSQL execution is the Owner-operated Production application. The transaction wrapper is the rollback boundary for statement failure. After an unambiguous commit, do not manually drop objects; any corrective schema change requires separate Owner review.

## Stop state

The repository is ready for the Owner action above. No commit, push, deploy, tag, release, or Production migration has been performed by Codex.
Current repository validation contract: the Migration 013 pre-check emits derived PASS/FAIL/WARN rows with check_name, status and detail, plus pass_count, fail_count, warn_count and overall_status using FAIL > WARN > PASS precedence. It remains read-only and ends in explicit rollback. Migration 013 SQL and the post-smoke artifact were not modified. This was repository validation-artifact reconciliation only; Production and Database were not accessed or mutated.