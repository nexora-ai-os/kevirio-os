# M028 isolated adversarial validation evidence

Date: 2026-08-22

Environment: `kevirio-m027-isolated` (`wcdyqfdindfcouvyrhdk`, Free/Nano, `ap-northeast-1`)

Production project: not used

Production alias: unchanged

## Executed database results

- clean M001→M027 rebuild: PASS
- M027 read-only baseline verification: PASS
- clean M028 forward apply: PASS (`8,548 ms`, remote CLI wall time)
- M028 read-only RLS/grant/function verification: PASS
- double apply: PASS (rejected by `m028_partial_state_detected`)
- partial table/function/memory-column/mixed states: PASS (each rejected before forward changes)
- injected transaction failure: PASS; valid M028 applied without reset afterward
- executable USER_A/USER_B security suite: PASS and rolled back
- cross-user/cross-workspace/Owner-admin privacy: PASS
- browser DML/service-only RPC boundary: PASS
- link spoof/self/unsupported/missing target rejection: PASS
- object and draft stale-write conflicts: PASS
- link/action/timeline idempotency: PASS
- paid/unknown source and L3 rejection: PASS
- secret-pattern rejection: PASS
- post-use freeze/export/rollback/M027 verification/reapply/reimport: PASS
- post-reimport identity sequence continuation: PASS after correction
- corruption/orphan health check: PASS

Two runtime defects were discovered and fixed before this evidence was recorded:

1. PostgreSQL rejected a URL regex repetition bound above its supported limit.
2. Timeline identity sequence was not advanced after post-use reimport.

## Modest-scale SQL baseline

Synthetic isolated data: 1,001 native objects, 201 drafts, 10,001 timeline events and 500 research findings. Values below are database execution averages over 100 iterations; they exclude network and UI latency and are not an SLA.

| Query | Mean |
|---|---:|
| Home attention projection | 0.02027 ms |
| Global search projection | 0.04498 ms |
| Draft resume | 0.11253 ms |
| Research retrieval | 0.30752 ms |
| Latest 100 timeline events from 10,001 | 4.83078 ms |

## Scope limits

This proves the M028 database package to system-readiness scope. It does not claim iOS Safari acceptance, real Provider availability, full application L5 reliability, or real-client readiness. Those remain post-Production-approval implementation and acceptance gates.

## Production-compatible namespace validation V2

Date: 2026-08-22

Trigger: Production preflight safely rolled back because unqualified `digest(text, text)` did not resolve outside the isolated environment's extension search path. Production remained M028-not-applied and its M027 recovery remained unchanged.

Remediation and audit:

- all three M028 package `digest` calls are explicitly `extensions.digest`
- all nine M028 package and executable-fixture UUID calls are explicitly `extensions.gen_random_uuid`
- static package scan found zero unqualified pgcrypto calls
- `028_namespace_compatibility_audit.sql` ran with `search_path=pg_catalog, public`
- exact `extensions.digest(text,text)` and `extensions.gen_random_uuid()` resolution: PASS
- scoped snapshot under the restricted search path: `M028_SCOPED_SNAPSHOT_PASS`
- independent snapshot comparison: `M028_RECOVERY_VERIFICATION_PASS`

Free/Nano isolated rerun:

- clean M027 baseline after isolated-only rollback: PASS
- revised M028 forward apply: PASS
- read-only RLS/grant/function verification: `M028_READ_ONLY_VERIFICATION_PASS`
- corruption/orphan health check: `M028_DATA_HEALTH_PASS`
- executable privacy/cross-user/cross-workspace/DML/cost/secret/concurrency/idempotency suite: PASS and rolled back
- M028 rollback: PASS
- M027 regression verification after rollback: PASS
- revised M028 reapply: PASS
- recovery verification after reapply: PASS
- read-only verification after reapply: PASS
- data health after reapply: PASS

Repository verification:

- full unit/integration/e2e suite: PASS
- M028 namespace regression tests: 13/13 PASS
- JavaScript syntax check: 334/334 PASS
- Production build: PASS

Severity: SEV-0 = 0; SEV-1 = 0.

Production mutation during V2 remediation and validation: 0. Production alias and M027 recovery were unchanged.
