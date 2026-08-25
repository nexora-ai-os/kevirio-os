# M031 — Canonical Affiliate Strategy

M031 is the smallest additive migration needed to represent `Research → Affiliate Strategy` without manufacturing an M029 `APPLICATION`. M001–M030 stay byte-stable.

It adds one private, owner-scoped canonical table and four protected lifecycle RPCs. `source_research_id` and `affiliate_program_id` are direct canonical relationships. Browser direct DML remains denied; Gemini FREE preparation is server-side/service-role only; Owner review/confirm/archive is authenticated and optimistic-concurrency guarded.

Production apply is not included in the current authorization. Validate in the isolated project, then stop with the exact Production activation boundary.

## Production activation order

1. Confirm project reference `cbbjkdoihrmcqqrrtruc` in the Supabase dashboard twice.
2. Run `031_preflight.sql` alone and require `M031_PREFLIGHT_PASS`.
3. Keep M027/M028/M029/M030 recovery objects; M031 adds a new empty table and does not mutate their data.
4. Run `031_affiliate_strategy.sql` as one complete SQL Editor execution.
5. Run `031_read_only_verification.sql`, `031_namespace_audit.sql`, and `031_data_health.sql` separately.
6. Run bounded authenticated Preview acceptance only after all database checks pass.
7. On failure before accepted Strategy data exists, run `031_rollback.sql`; then require `031_post_rollback_baseline.sql` PASS.

Do not run the isolated executable fixture in Production. It intentionally creates transaction-scoped synthetic records and is isolated-only.
