# M029 Canonical Mutation Foundation

Status: **DESIGN / ISOLATED VALIDATION REQUIRED — NOT APPROVED FOR PRODUCTION**

M029 adds version-aware protected mutation, private canonical ownership, durable drafts,
timeline append, conversion, and guarded linking without changing M001-M028.

## Normal package order

1. `029_preflight_and_scoped_snapshot.sql`
2. Confirm `M029_SCOPED_SNAPSHOT_PASS` and eight manifest rows.
3. `029_canonical_mutation_foundation.sql` as one transaction.
4. `029_read_only_verification.sql`
5. `029_data_health_check.sql`
6. `029_executable_security_and_concurrency.sql`
7. `029_namespace_compatibility_audit.sql`
8. `029_performance_validation.sql`

## Accepted-data recovery validation

Never concatenate these files. Use a clean SQL Editor execution for every item and proceed
only after the named PASS result.

0. `029_recovery_00_create_accepted_fixture.sql`
A. `029_freeze_accepted_data.sql`
B. `029_recovery_b_export_verification.sql`
C. `029_rollback.sql`
D. `029_recovery_d_m028_baseline_verification.sql`
E. `029_canonical_mutation_foundation.sql`
F. `029_reimport_accepted_data.sql`
G. `029_recovery_g_reimport_verification.sql`
H. `029_recovery_h_continuation_verification.sql`

After E, rerun every normal verification gate. Recovery tables remain until Owner
acceptance; cleanup requires separate approval and uses
`029_cleanup_accepted_data_recovery.sql`.

Production execution remains prohibited until separate Owner approval. Keep the Production
alias and M027/M028 recovery unchanged.

## Security contract

- Browser tables are SELECT-only; writes use SECURITY DEFINER RPCs with empty search path.
- PRIVATE rows require the authenticated data owner, never workspace Owner/admin authority.
- Updates and archives require the exact expected version; drafts bind their base version.
- Actual Revenue and Evidence remain untouched. AI output is not Evidence.
- Paid/UNKNOWN cost and L3/L4 external execution remain denied.
