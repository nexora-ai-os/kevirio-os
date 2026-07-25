# Release Readiness

Local Build/Test/Data contracts are release candidates. Remote Security Gate remains conditional until migration/RLS/auth are verified against Supabase.

External execution: `CANDIDATE_READY_LOCKED`.

Blocking before production use:

- remote migration/RLS verification;
- active Owner bootstrap and app login;
- live cross-workspace deny checks;
- retention/backup confirmation;
- Preview critical-path smoke;
- branch protection/CI observation.
