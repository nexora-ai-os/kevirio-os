# KEVIRIO V1 Rollback Runbook

## Rules

- Preserve applied migration history; never edit Migration 003–013 after application.
- Never use DROP, rename, data rewrite or RLS bypass as an emergency shortcut.
- Keep External Execution, Global and Provider switches false.
- Preserve Approval, Evidence, Actual Revenue and audit history.

## Required evidence

- Previous known-good deployment identifier.
- Approved release commit/tag and Production URL.
- Supabase Production project and backup/PITR status.
- Migration 013 pre-check, apply and post-smoke output.

## Application rollback

1. Stop Owner mutations and release activity.
2. Preserve safe console/network diagnostics.
3. Restore the previous known-good deployment using the hosting rollback mechanism.
4. Do not revert database migrations.
5. Verify Owner login, Workspace reads, Approval/Evidence/Revenue reads and External Execution lock.

## Migration 013 failure

- Before commit: rely on transaction rollback, record the exact error and stop.
- Ambiguous result: never rerun; inspect catalog state read-only and classify Not Applied, Fully Applied or Unknown.
- After confirmed commit: keep the database unchanged; roll back only the application if schema-compatible. Migration 014 remains prohibited without explicit Owner approval.

## Data or security incident

1. Stop affected writes and Actual Revenue finalization.
2. Preserve immutable snapshots, Evidence and audit records.
3. Isolate Workspace, source and currency.
4. Rotate exposed credentials only through authorized consoles without displaying them.
5. Restore data only through an Owner-approved backup procedure.

## Completion

Rollback is complete only when the known-good application serves Production, Owner/Workspace checks pass, canonical data remains intact, and External Execution remains LOCKED.
