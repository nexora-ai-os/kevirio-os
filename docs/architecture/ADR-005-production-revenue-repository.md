# ADR-005: Production Revenue Repository Integration

Status: Accepted for the Revenue MVP foundation
Date: 2026-07-25

## Decision

Supabase is the canonical source of truth for the production revenue path. React components may not write production revenue tables directly. They use `createRevenueRepository`, which scopes every read by the authenticated Owner workspace and sends mutations through authenticated RPCs.

The production path is:

`Market snapshot → Opportunity + Owner Decision → Campaign → Task → Artifact → Approval → Manual action → Evidence candidate → Actual approval → Revenue record`

Migration 005 adds two session-bound commands:

- `create_revenue_candidate`: atomically creates the opportunity through paused workflow/approval state.
- `register_revenue_evidence`: atomically stores a financial evidence candidate and immutable approval preview.

Both derive the actor with `auth.uid()`, call `is_active_workspace_member`, validate the KEVIRIO brand belongs to the workspace, and expose execute permission only to `authenticated`.

Existing `decide_approval` and `verify_evidence_and_record_revenue` remain the only approval/revenue mutation paths. Browser roles still cannot insert revenue records or approval decisions directly.

## Safety invariants

- No service-role key, raw session token, or Owner ID enters a browser mutation payload.
- `external_execution_allowed` is always `false`.
- Mock and forecast input remains explicitly marked in provenance and artifact disclosure.
- Evidence begins as `verification_required`; it never becomes Actual merely because it was submitted.
- Actual revenue requires a separate approved `actual_revenue_verification` request.
- Idempotency keys prevent duplicate opportunity, approval, workflow, evidence, and revenue creation.
- EG is not created or selected by this flow.

## Compatibility

Legacy LocalStorage screens remain readable and unchanged. They are not considered canonical, are not automatically imported, and do not feed Actual revenue. This enables gradual migration without silently mixing mock/legacy and production records.

## Known follow-up

Migration 005 must be applied to Remote Supabase before the new Production Revenue screen can mutate data. A remote authenticated smoke test is required after application.
