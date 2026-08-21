# M028_FULL_OPERATIONAL_COMPLETION — Owner Review Package

Status: `M028_REQUIRED_FOR_FULL_OPERATION`
Production apply: **NOT APPROVED / NOT EXECUTED**

## Why M028 is required

M001–M027 do not provide canonical, privacy-safe persistence for universal object linking, cross-device drafts, append-only operational timelines, source-attributed Global Intelligence, auditable L0–L2 internal actions, free-quota health, or Owner memory pin/archive state. Reusing unrelated JSON payloads would make authorization, provenance, search, optimistic concurrency and recovery non-verifiable.

M028 consolidates every identified schema gap. It does not replace Affiliate, Revenue, Evidence, AI conversation or M027 memory truth.

## Canonical data ownership matrix

Canonical domain data always wins. M028 owns mutable business fields only for the two new native types shown below; all other types are resolver-validated references and are never copied into `operational_objects`.

| Type | Canonical table/read-write path | M028 role | Projection/backfill | Archive/delete and retrieval |
|---|---|---|---|---|
| `GOAL` | `campaigns` / existing protected campaign path | reference/link/timeline | reference only; no backfill | closed/cancelled stops resolving |
| `STRATEGY` | `owner_decisions` / existing decision path | reference/link/timeline | reference only | inactive decision stops resolving |
| `WORK` | `tasks` / existing task path | reference/link/timeline | reference only | cancelled stops resolving |
| `APPLICATION` | `opportunities` / existing opportunity path | reference/link/timeline | reference only | rejected/expired stops resolving |
| `CLIENT` | `clients` / existing client path | reference/link/timeline | reference only | archived stops resolving |
| `CONTENT` | private `personal_operational_records(CONTENT)` path | private reference/link | reference only | archived/deleted stops resolving |
| `SNS_ITEM` | `content_assets` SNS types / existing content path | reference/link | reference only | archived stops resolving |
| `KNOWLEDGE` | `business_memory_records` / existing memory path | reference/link | reference only | deletion state stops resolving |
| `IMPROVEMENT` | private `personal_operational_records(FEEDBACK)` path | private reference/link | reference only | archived/deleted stops resolving |
| `GLOBAL_OPPORTUNITY` | active `research_findings(OPPORTUNITY)` | reference/link | created by research RPC | superseded/retracted/archived stops resolving |
| `RESEARCH_PACKAGE` | `operational_objects` | M028 native owner | new objects only | optimistic archive; no hard delete |
| `QUICK_CAPTURE` | `operational_objects` | M028 native owner | new objects only | optimistic archive; no hard delete |

AI retrieval and Search must retrieve canonical domain rows first and may use M028 only to discover validated relations. An unresolved reference is omitted and reported by the health check; M028 never overwrites canonical state.

## New tables

1. `operational_objects`
2. `operational_object_drafts`
3. `operational_object_links`
4. `operational_activity_events`
5. `research_sources`
6. `research_findings`
7. `internal_action_records`
8. `provider_free_quota_states`

## Existing object changed additively

`ai_memory_records` receives only:

- `pinned_at`
- `owner_visibility` (hard constrained to `PRIVATE`)
- `owner_archived_at`

No M001–M027 migration file is edited. No existing business row is rewritten.

## RLS policies

All eight new tables use RLS plus FORCE RLS and exactly one authenticated read policy:

- `operational_objects_self_read`
- `operational_drafts_self_read`
- `operational_links_self_read`
- `operational_activity_self_read`
- `research_sources_self_read`
- `research_findings_self_read`
- `internal_actions_self_read`
- `provider_quota_owner_read`

Every policy binds both `auth.uid()` and `resolve_personal_workspace()`. Team membership and Owner administration do not grant access to another user’s Personal Workspace.

## Protected functions

Authenticated:

- `save_operational_object`
- `save_operational_draft`
- `archive_operational_object`
- `link_operational_objects`
- `prepare_internal_action`
- `set_ai_memory_owner_state`

Service role only:

- `complete_internal_action`
- `register_research_source`
- `record_research_finding`
- `upsert_provider_free_quota_state`

Internal helper:

- `m028_safe_json`

Direct browser INSERT/UPDATE/DELETE is revoked on every new table.

## Indexes and constraints

- attention/due and type/update retrieval indexes
- bidirectional object-link indexes
- append-only activity lookup index
- research domain/country/freshness indexes
- internal-action status/risk index
- free-quota health index
- pinned-memory retrieval index
- Personal Workspace composite ownership FKs
- research supersession composite owner/workspace FK
- optimistic object/draft/action versions
- zero paid-cost and locked-external-execution checks
- private-only memory visibility
- bounded JSON/text and credential-pattern rejection

## Compatibility

- M026 Affiliate edit and M027 Affiliate operational/draft RPCs remain canonical.
- M027 AI threads/messages/memory remain canonical; M028 only links to them and adds Owner memory state.
- `revenue_records`, `evidence_candidates`, forecasts and operating costs are not modified.
- M028 cannot create Actual Revenue or Evidence.
- Existing `personal_operational_records` remain valid. M028 objects are the normalized operational layer required for universal links, timeline and cross-device conflict handling; migration/backfill is not automatic.
- External Execution remains locked. L3/L4 are absent from M028 enums.

## Recovery strategy

Before Production apply, create a scoped snapshot only for the three new nullable/default columns on `ai_memory_records` plus catalog manifests for affected objects. New M028 tables contain zero pre-apply rows and need no pre-apply data copy. Keep the existing `m027_recovery` snapshot untouched.

If apply fails, the single transaction rolls back automatically. If post-apply acceptance fails, run `028_rollback.sql` only after confirming no accepted M028 operational data must be exported. The rollback does not touch M001–M027 business data other than dropping the three additive memory columns.

After M028 has accepted real data, rollback is always: revoke M028 mutation RPCs with `028_freeze_export_before_rollback.sql`, verify the locked export manifest, run rollback, restore M001–M027 service, and retain the export. After a corrected M028 reapply, `028_reimport_after_reapply.sql` restores the accepted M028 rows and Owner memory state. Never run the empty-data rollback assumption after practical use.

`owner_visibility='PRIVATE'` is a deliberate safe Phase-1 limitation. Future sharing must be additive and explicitly Owner-approved; no current Member or Owner-admin bypass is created.

## Supabase Web SQL Editor apply procedure

1. Confirm the Production project and retain `m027_recovery`.
2. Run `028_namespace_compatibility_audit.sql` with the Production-compatible restricted search path.
3. Run a read-only inventory for the eight table names, thirteen function signatures and three memory columns; all must be absent.
4. Run `028_preflight_and_scoped_snapshot.sql`, then `028_recovery_verification.sql`.
5. Paste the complete `028_full_operational_completion.sql` into a new SQL Editor query.
6. Run the whole transaction once. Do not select fragments.
7. Run `028_read_only_verification.sql` and `028_data_health_check.sql`.
8. Run bounded Production security smoke without fixture insertion.
9. Stop for Owner cross-device practical acceptance. Do not delete either recovery snapshot.

## Package files

- `028_full_operational_completion.sql` – forward migration
- `028_namespace_compatibility_audit.sql` – read-only pgcrypto/schema-resolution audit under a Production-compatible restricted search path
- `028_preflight_and_scoped_snapshot.sql` – private, metadata-only preflight snapshot
- `028_recovery_verification.sql` – read-only snapshot/current comparison
- `028_read_only_verification.sql` – post-apply read-only assertions
- `028_data_health_check.sql` – read-only corruption and orphan detection
- `028_security_test_plan.sql` – isolated security/concurrency suite
- `028_rollback.sql` – bounded rollback
- `028_freeze_export_before_rollback.sql` – freeze and locked post-use export
- `028_reimport_after_reapply.sql` – verified restoration after corrected reapply
- `028_cleanup_recovery.sql` – separately approved post-acceptance cleanup
- `VALIDATION_EVIDENCE.md` – executed isolated-runtime evidence and limits

## What M028 does not authorize

- Production application
- Production alias change
- paid AI or paid fallback
- paid/unknown research providers
- Canva write scopes
- Gmail/SNS/public/customer communication
- L3 or L4
- secrets or credentials in operational data
- automatic promotion of AI output to Evidence or Actual
