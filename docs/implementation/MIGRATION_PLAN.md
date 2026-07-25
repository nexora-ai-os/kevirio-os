# Migration Plan

Apply `003_revenue_production_foundation.sql` only after confirming 001/002 are present. It is additive and does not drop existing data. It creates the generic workspace and Revenue Production Foundation.

After 003, apply `004_owner_workspace_bootstrap_access.sql`. Migration 004 adds only the authenticated read privileges needed to verify Owner profile/workspace/membership/brand state and reasserts authenticated execute on the existing bootstrap RPC. It does not disable RLS or grant browser write privileges.

Preflight: backup, migration history, active `owner_profiles` row. Apply in Supabase SQL editor/CLI. Run `npm run verify:migrations`. Then authenticated Owner calls `bootstrap_owner_workspace('kevirio-owner','KEVIRIO Owner Workspace')`.

Rollback: do not automatically drop tables. Disable new UI feature usage, retain data, revoke new RPC execute grants if containment is needed, restore from backup only under Owner approval. A destructive rollback requires a separately reviewed migration.
