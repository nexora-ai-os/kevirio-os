# M033 validation evidence

Environment: `kevirio-m027-isolated` (`wcdyqfdindfcouvyrhdk`, Free/Nano). Production mutation: zero.

Executed sequence:

- scoped contract snapshot: `M033_PRE_APPLY_SNAPSHOT_PASS`
- initial apply: PASS
- post-apply security/data verification: `M033_ISOLATED_POST_APPLY_VERIFICATION_PASS`
- rollback and M032 baseline restoration: `M033_ROLLBACK_M032_BASELINE_PASS`
- reapply and final verification: `M033_ISOLATED_ROLLBACK_REAPPLY_PASS`

Final invariants: SEV-0 `0`; SEV-1 `0`; browser direct DML denied; legacy four-argument browser RPC denied; six-argument RPC uses atomic `updated_at` plus `business_version`; RLS unchanged; recovery retained; valid A8 query/encoded tracking URLs accepted; unsafe, malformed and overlong URLs denied; business rows changed `0`; Paid AI `¥0`; Paid fallback `OFF`; External Execution `LOCKED`.

Repository evidence: active Affiliate regression `99/99`; focused M033 tests `10/10`; JavaScript syntax `376/376`; production build PASS.
