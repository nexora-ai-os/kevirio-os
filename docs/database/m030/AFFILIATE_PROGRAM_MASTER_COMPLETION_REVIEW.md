# Affiliate Program Master completion review

Status: `OWNER_APPROVAL_REQUIRED_BEFORE_PRODUCTION_SCHEMA_CHANGE`

## Field capability matrix

| Field | DB storage | Read | Write today | Contract | UI | Real operation | Status |
|---|---|---|---|---|---|---|---|
| ASP name | `affiliate_program_master.asp_name` | Owner SELECT | yes | M025 register / M026 update | register + edit | required | EDITABLE_NOW |
| Program ID | `program_id` | yes | yes | M025/M026 | register + edit | required | EDITABLE_NOW |
| Advertiser | `advertiser_name` | yes | yes | M025/M026 | register + edit | required | EDITABLE_NOW |
| Program name | `program_name` | yes | yes | M025/M026 | register + edit | required | EDITABLE_NOW |
| Category | `category` | yes | yes | M025/M026 | register + edit | recommended | EDITABLE_NOW |
| Reward type | `reward_type` | yes | no | none | overview only | required when known | READ_ONLY_CONTRACT_GAP |
| Reward summary | `reward_summary` | yes | yes | M026 | edit | required | EDITABLE_NOW |
| Reward details | `reward_details jsonb` | yes | no | none | overview only | useful | READ_ONLY_CONTRACT_GAP |
| EPC | `epc numeric` | yes | no | none | overview/performance | optional ASP metric | READ_ONLY_CONTRACT_GAP |
| Approval rate | `approval_rate numeric` | yes | no | none | overview/performance | optional ASP metric | READ_ONLY_CONTRACT_GAP |
| Revisit/cookie period | `revisit_window_days` | yes | no | none | overview | business critical when known | READ_ONLY_CONTRACT_GAP |
| Confirmation period | `confirmation_days` | yes | no | none | overview | business critical when known | READ_ONLY_CONTRACT_GAP |
| Conversion conditions | `conversion_conditions` | yes | yes | M026 | edit | required | EDITABLE_NOW |
| Rejection conditions | `rejection_conditions` | yes | yes | M026 | edit | required | EDITABLE_NOW |
| PR points | `pr_points` | yes | no | none | not editable | useful | READ_ONLY_CONTRACT_GAP |
| Listing policy | `listing_policy` | yes | no | none | research read-only | required | READ_ONLY_CONTRACT_GAP |
| Listing NG words | `listing_ng_words text[]` | yes | no | none | research read-only | required when applicable | READ_ONLY_CONTRACT_GAP |
| Listing NG raw | `listing_ng_words_raw` | yes | no | none | research read-only | required provenance | READ_ONLY_CONTRACT_GAP |
| Listing verification | `listing_ng_words_verification_status` | yes | no | none | research read-only | required truth state | READ_ONLY_CONTRACT_GAP |
| Compliance notes | `compliance_notes` | yes | yes | M026 | edit | required when applicable | EDITABLE_NOW |
| Affiliate URL | `affiliate_url` | yes | yes | M025 link RPC | Content tab | required before publication | EDITABLE_NOW |
| Affiliate link state | `affiliate_link_status` | yes | yes | M025 link RPC | Content tab | required | EDITABLE_NOW |
| Source type | `source_type` | yes | register fixed to `OWNER_MANUAL` | M025 register | research read-only | provenance required | READ_ONLY_CONTRACT_GAP |
| Source verified at | `source_verified_at` | yes | no | none | research read-only | freshness required | READ_ONLY_CONTRACT_GAP |
| Source notes | `source_notes` | yes | yes | M025/M026 | register + edit | required provenance | EDITABLE_NOW |
| Owner notes | `owner_notes` | yes | yes | M026 | edit | useful | EDITABLE_NOW |
| Business goal | `business_goal` | yes | yes | M027 operational RPC | edit/autosave | required | EDITABLE_NOW |
| Target audience | `target_audience` | yes | yes | M027 | edit/autosave | required | EDITABLE_NOW |
| Promotion channels | `promotion_channels` | yes | yes | M027 | edit/autosave | required | EDITABLE_NOW |
| Content plan | `content_plan` | yes | yes | M027 | edit/autosave | required | EDITABLE_NOW |
| Compliance checklist | `compliance_checklist` | yes | yes | M027 | storage exists; no structured editor | useful | UI_ONLY_GAP |
| Priority | `priority` | yes | yes | M027 | edit/autosave | useful | EDITABLE_NOW |
| Next action | `next_action` | yes | yes | M027 | edit/autosave | required | EDITABLE_NOW |
| Next action due | `next_action_due_at` | yes | yes | M027 | edit/autosave | useful | EDITABLE_NOW |
| Publication status | `publication_status` | yes | yes | M027 | edit/autosave | useful | EDITABLE_NOW |
| Publication URL | `publication_url` | yes | yes | M027 | edit/autosave | useful | EDITABLE_NOW |

## Why a protected server route alone is insufficient

Owner authentication, workspace membership, input validation and server-only `service_role` can be implemented in an API route. However Supabase REST calls cannot make the following multi-step contracts atomic:

1. lock current row, compare expected version, update all expanded fields, and append the audit event;
2. lock the Program, inspect every dependency, reject protected history or delete the Program, and append a durable deletion audit record.

Executing these as separate REST requests permits time-of-check/time-of-use races and partial success. Direct `service_role` table mutation would also bypass the canonical protected mutation boundary. Therefore it does not meet the approved reliability and audit contract.

## Minimal additive contract proposed

No existing migration is modified. A single additive migration is required with exactly two authenticated Owner-only `SECURITY DEFINER`, empty-search-path RPCs:

### `update_affiliate_program_master_practical(uuid,timestamptz,bigint,jsonb)`

- resolves `auth.uid()` and canonical personal workspace fail-closed;
- locks the Program row;
- checks both `expected_updated_at` and `expected_business_version`;
- accepts a strict allowlist covering the current M026 fields plus reward, metric, PR, listing, NG-word, verification and source-freshness fields;
- validates lengths, enum values, numeric ranges, URLs, sensitive-data denial and the NG truth-state constraint;
- increments `business_version` and lets `updated_at` advance;
- writes `company_operating_events` in the same transaction with changed field names only;
- returns new versions, never the submitted body.

### `delete_affiliate_program_master_if_safe(uuid,timestamptz,bigint)`

- Owner/personal-workspace authorization and row lock;
- checks both optimistic-concurrency tokens;
- rejects unless the Program is classified disposable/test by explicit stored provenance or an explicit Owner cleanup flag supplied to the RPC and recorded in audit metadata;
- rejects Publications, Performance, Revenue, Evidence, Content, M028/M029 object links/conversions, internal actions and protected timeline relationships;
- does not cascade into Revenue, Evidence, Publication or Audit;
- deletes only the M027 draft and Program row when eligible;
- appends a non-secret tombstone audit event in the same transaction;
- returns `SAFE_TO_DELETE`, `ARCHIVE_ONLY`, or `PROTECTED_HISTORY` plus counts/reason codes.

The dependency inventory must use exact Production object relationships discovered during preflight. Audit history itself is retained as a tombstone and is not treated as disposable.

## Security and RLS effect

- Browser table DML remains revoked.
- Only `authenticated` receives RPC execute; `anon/public` are revoked.
- `service_role` remains server-side only and is not required by the browser path.
- RPCs use `SECURITY DEFINER`, owner `postgres`, `search_path=''`, fully-qualified objects and `auth.uid()`.
- Member and cross-workspace access fail closed.
- Paid AI remains zero and External Execution remains locked.

## Recovery / rollback / validation

Before Production apply, create a scoped snapshot of all 12 Program rows, M027 drafts and affected security metadata in a browser-inaccessible recovery schema/table; retain M027/M028/M029 recovery. Verify deterministic counts/checksums. Apply the additive migration in one transaction. Isolated validation must cover create, expanded update, reload, stale conflict, NG truth states, dependency-denied delete, eligible delete, rollback, reapply and recovery restore. Rollback drops only the two new RPCs and their grants; existing M001–M029 objects remain unchanged. Production apply requires separate Owner approval after isolated PASS.

## Current cleanup classification

The 12 visible rows are `UNPROVEN`, not `SAFE_TO_DELETE`. The authenticated UI proves their existence and business fields, but it does not expose all protected logical dependencies. No Production deletion or archive was executed.
