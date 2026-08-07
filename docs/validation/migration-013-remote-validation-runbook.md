# Migration 013 Remote Validation Runbook

Status: APPLIED / VERIFIED - retained Owner-reported historical evidence

Repository canonical SHA authority is the SHA-256 of the exact Git-blob bytes for supabase/migrations/013_company_operating_cycle.sql: B5DE02C52806E30F76565C9045C9E4E7FD9CCC5365973C746AB7EF6F563365BB. The Windows CRLF checkout SHA 3B8E361248D3DA6EC5EDD20700BD3FA67D5C6E267FC8E23EE8BC97E9A5B8DE7F is non-authoritative checkout metadata, not Production evidence. This repository-only reconciliation did not access original Production bytes, execute SQL, modify Production, or reapply Migration 013. The validation contract remains read-only and rollback-bounded.
Owner authority: Production application requires explicit Owner action.

## Fixed order

1. Confirm the Supabase SQL Editor is connected to the intended Production project. Do not display or copy secrets.
2. Open `supabase/validation/013_pre_apply_checks.sql`, copy the complete file, and run it unchanged.
3. Require one result row with `M013_PRECHECK_PASS`, `NOT_APPLIED_READY`, the fixed SHA-256, and `transaction_read_only=true`.
4. Stop on every SQL error, missing row, partial-schema state, different SHA, or unexpected project.
5. Open `supabase/migrations/013_company_operating_cycle.sql`, verify its SHA-256 against this runbook, copy the complete file, and run it once.
6. Do not re-run after an ambiguous result. Record the exact SQL Editor result and stop.
7. Open `supabase/validation/013_post_apply_smoke.sql`, copy the complete file, and run it unchanged.
8. Require one result row with `M013_POST_APPLY_SMOKE_PASS`, table count 8, Revenue Engine definition count 6, External Execution `LOCKED`, and execution mode `READ_ONLY_ROLLBACK`.
9. Stop and report any deviation. Do not create Migration 014 to conceal a failed or partial application.

## What Migration 013 changes

It adds eight Company Operating System objects, six locked Revenue Engine definitions, workspace-scoped RLS read models, one service-role-only Revenue Engine registration RPC, append-only operating events, updated-at and Manual Execution Package contract triggers. It adds composite unique constraints to `brand_profiles` and `offer_operations` only when missing. It does not modify Migration 003–012 files, unlock External Execution, call Providers, authorize OAuth, or create Actual Revenue.

## What the validation SQL changes

Nothing. Both validation files start a read-only transaction and end with `ROLLBACK`. They inspect catalog state, required baseline objects, RLS, policies, grants, functions, search paths, triggers, indexes, seed definitions, raw-content locks, and External Execution locks.

## Failure stop conditions

- Wrong Production project or project cannot be confirmed.
- Pre-check does not return `M013_PRECHECK_PASS` and `NOT_APPLIED_READY`.
- Candidate SHA differs from the fixed SHA in this runbook.
- Migration returns any SQL error or an ambiguous client/network result.
- Post-smoke does not return the exact PASS row.
- Any authenticated mutation grant, missing RLS policy, unsafe function search path, missing composite workspace FK, missing immutable trigger, or unlocked External Execution state.

## Expected non-effects

No existing Production business row is changed by applying the migration. Existing Manual Execution Packages are not backfilled during migration. No Provider request, OAuth authorization, external publish, external cost, Actual Revenue creation, Approval consumption, or workspace membership change occurs.

## Rollback

The migration is transaction-wrapped. A statement error rolls back the transaction. After a reported successful commit, do not manually drop objects in Production. Stop and prepare an Owner-reviewed additive rollback migration only if a verified production defect requires it.

## Fixed artifact

Migration 013 SHA-256: `B5DE02C52806E30F76565C9045C9E4E7FD9CCC5365973C746AB7EF6F563365BB`
Current repository validation contract: the Migration 013 pre-check emits derived PASS/FAIL/WARN rows with check_name, status and detail, plus pass_count, fail_count, warn_count and overall_status using FAIL > WARN > PASS precedence. It remains read-only and ends in explicit rollback. Migration 013 SQL and the post-smoke artifact were not modified. This was repository validation-artifact reconciliation only; Production and Database were not accessed or mutated.