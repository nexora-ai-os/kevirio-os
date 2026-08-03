# Migration 012 RLS Report

Result: **STATIC PASS; runtime RLS Not Executed**

- Seven workspace tables enable RLS.
- One Owner-read policy per table requires `workspace_members.user_id = auth.uid()`, role `owner`, status `active`, and matching `workspace_id`.
- `anon`, `authenticated` and `PUBLIC` receive no table mutation grant.
- Protected mutation RPCs are revoked from `public`, `anon` and `authenticated`; execute is granted only to `service_role`.
- Protected RPCs re-check workspace/Owner/capability relationships internally.
- Composite FKs bind task/event/handoff/quota/provider/approval records to one workspace.

Cross-workspace runtime attempts were not executed against PostgreSQL. The staging-only matrix and stop conditions are documented in `migration-012-remote-validation-runbook.md`.
