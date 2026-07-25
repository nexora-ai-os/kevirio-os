# Migration Plan

Apply `003_revenue_production_foundation.sql` only after confirming 001/002 are present. It is additive and does not drop existing data. It creates the generic workspace and Revenue Production Foundation.

Preflight: backup, migration history, active `owner_profiles` row. Apply in Supabase SQL editor/CLI. Run `npm run verify:migrations`. Then authenticated Owner calls `bootstrap_owner_workspace('kevirio-owner','KEVIRIO Owner Workspace')`.

Rollback: do not automatically drop tables. Disable new UI feature usage, retain data, revoke new RPC execute grants if containment is needed, restore from backup only under Owner approval. A destructive rollback requires a separately reviewed migration.
