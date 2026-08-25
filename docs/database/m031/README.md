# M031 — Canonical Affiliate Strategy

M031 is the smallest additive migration needed to represent `Research → Affiliate Strategy` without manufacturing an M029 `APPLICATION`. M001–M030 stay byte-stable.

It adds one private, owner-scoped canonical table and four protected lifecycle RPCs. `source_research_id` and `affiliate_program_id` are direct canonical relationships. Browser direct DML remains denied; Gemini FREE preparation is server-side/service-role only; Owner review/confirm/archive is authenticated and optimistic-concurrency guarded.

Production apply is not included in the current authorization. Validate in the isolated project, then stop with the exact Production activation boundary.
