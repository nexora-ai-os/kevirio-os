-- ISOLATED PROJECT ONLY. Never execute fixture mutations against Production.
begin;

-- Harness requirements:
-- USER_A and USER_B are ACTIVE identities with distinct canonical Personal Workspaces.
-- Run every authenticated block with request.jwt.claims bound to that user.

-- A. USER_A creates GOAL/WORK/CONTENT through save_operational_object.
--    Direct INSERT/UPDATE/DELETE on all eight M028 tables => permission_denied.
-- B. USER_A saves a draft twice; same expected version succeeds idempotently only once.
--    Stale draft_version and stale object version => *_stale_or_not_found.
-- C. USER_B SELECT of USER_A objects, drafts, links, activity, research and actions => zero.
--    USER_B protected RPC mutation of USER_A id => denied/not found.
-- D. Add USER_A as Team/administrative Owner around USER_B; repeat C => still denied.
-- E. Cross-workspace endpoint links => operational_link_*_denied.
-- F. authenticated execution of research/quota/service completion RPCs => permission_denied.
-- G. service_role research insert with PAID or UNKNOWN source => research_source_cost_denied.
-- H. prepare_internal_action with L3/L4, HIGH risk, paid cost, external execution or invalid policy => denied.
-- I. secret/password/token-like values in title, summary, details, provenance or result => denied.
-- J. research supersession across owner/workspace => denied by composite FK/RPC ownership check.
-- K. memory pin/archive for another owner or stale version => memory_stale_or_not_found.
-- L. assert no M028 trigger/function inserts Evidence, Actual Revenue or operating cost.
-- M. rollback leaves row counts and checksums unchanged.

rollback;
