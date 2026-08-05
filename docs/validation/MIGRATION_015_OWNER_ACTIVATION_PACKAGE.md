# Migration 015 Owner Activation Package

Production Migration 015:
APPLIED
VERIFIED

Owner-reported validation: `M015_POST_APPLY_SMOKE_PASS` (`pass_count=78`, `fail_count=0`, `warn_count=0`). External Execution remains `LOCKED`.

## Frozen artifact

- Migration: `supabase/migrations/015_affiliate_intelligence_v2.sql`
- SHA-256: `14FF5413ECA910095A47DE6F7032739693FEC980CCF3E754DD864DBFDDAD99F1`
- Pre-check: `supabase/validation/015_pre_apply_checks.sql`
- Post-smoke: `supabase/validation/015_post_apply_smoke.sql`
- Static validator: `scripts/validate-migration-015-static.mjs`

## Data-model rationale

| Table | Responsibility and parent | Truth/lifecycle | Mutation and retention |
| --- | --- | --- | --- |
| `affiliate_products` | Product profile for `affiliate_programs`; Offer cannot represent product variants/models | Explicit Truth Class; active/superseded/archived | Protected boundary only; archived, not deleted |
| `affiliate_product_sources` | Attribution/source history for a Product | active/stale/rejected/archived | Safe references only; no raw provider payload |
| `affiliate_research_entities` | Typed Audience, Competitor, or Keyword research linked to a Program | Explicit Truth Class; draft/review/active/rejected/archived | Bounded safe attributes; archived, not deleted |
| `affiliate_experiments` | Affiliate hypothesis and manual experiment lifecycle | Result Truth Class; Owner Approval reference | External Execution always false; archived, not deleted |
| `affiliate_intelligence_snapshots` | Versioned score/SWOT/strategy/content-plan/forecast/audit output | Forecast/Inference/Unknown/Mock/Test only | Immutable version identity; bounded safe payload; superseded/archived |
| `affiliate_risk_findings` | Compliance/brand/data-quality finding and rationale | PASS/REVIEW_REQUIRED/BLOCKED/UNKNOWN | May reference canonical Owner Decision; archived, not deleted |
| `affiliate_alerts` | Deduplicated actionable anomaly notification | Severity plus open/acknowledged/resolved/archived | No external notification execution |
| `affiliate_daily_briefs` | Rule-versioned, maximum-three-action Owner Brief | Inference/Unknown/Mock/Test | Safe bounded summary; superseded/archived |
| `reusable_business_assets` | Internal reuse metadata referencing canonical Content | internal/review/approved/deprecated/archived | Export, public marketplace, and payment hard-locked false |

Existing canonical tables remain authoritative for Offer, Operation, Approval, Execution, Evidence, Actual Revenue, Actual Cost, Content, Learning, Decision, Audit, AI Employees, and AI Tasks. Separate strategy, content-plan, task-plan, prompt-definition, and AI-employee tables were rejected to avoid duplicate responsibility. Intelligence snapshots may describe strategy/content plans but never replace canonical Content or Approval.

## Owner-controlled activation procedure

1. Confirm the exact migration SHA above.
2. Run `015_pre_apply_checks.sql`; it is read-only and must report `fail_count=0`.
3. Review the frozen SQL and confirm External Execution remains `LOCKED`.
4. Obtain distinct explicit Owner approval to apply Migration 015. This package is not that approval.
5. Apply the frozen migration once through the approved migration path.
6. Run `015_post_apply_smoke.sql`; it is read-only and must report `fail_count=0`.
7. Preserve outputs as evidence. Do not seed or mutate the existing RingConn Offer.

## Rollback and recovery

The migration is transaction-wrapped, so an error before `commit` rolls back atomically. If pre-check fails, do not apply. If post-smoke fails after commit, stop application activation, keep Phase 3 disabled, preserve evidence, and use Owner-approved additive recovery only. Never edit Migration 015 after application; corrective schema work must use Migration 016+.

No destructive down migration is supplied. Application rollback is to keep V2 repository/UI integration disabled while the additive schema remains inaccessible to unauthorized principals.

Fail-stop on SHA mismatch, validation failure, existing Offer change, canonical Actual mutation, browser mutation privilege, secret/raw payload storage, unlocked External Execution, or missing Workspace isolation.

Production Mutation performed by this package: NONE.
