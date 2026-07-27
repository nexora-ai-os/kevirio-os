# KEVIRIO Current-State Forensic — 2026-07-27

## Verified architecture

- React/Vite SPA; `SupabaseOwnerAuthGate` wraps the entire application.
- Primary navigation is internal state, not URL routing.
- Canonical production path: Owner Auth → workspace/brand RLS → revenue repository → Opportunity/Campaign → immutable Approval → Manual Package → Evidence → Actual approval → append-only Revenue Record → Analytics.
- External publish, SNS, email, OAuth, payment and advertising execution remain locked.
- OpenAI has one controlled server-side sandbox path with verified Owner context, usage reservation and selected-field egress. General AI/workflow engines remain local mock.
- Legacy feature engines and most advanced screens use localStorage/static mock state. They are supporting prototypes, not production sources of truth.

## Asset classification

### KEEP

- App-wide Owner Auth and browser/server credential boundary.
- Migrations 003–008, RLS, workspace integrity triggers and authenticated-only RPCs.
- Canonical revenue repository, approval snapshots, evidence gate, audit log and Actual-only Analytics mapping.
- Controlled OpenAI sandbox and fail-closed external execution policy.
- Node test/CI/build/security checks.

### EXTEND

- Canonical repository beyond Revenue into offers, media assets, performance facts and Business Memory.
- Cost model beyond campaign-attributed cost into classified operating costs and Owner workload.
- Media/Affiliate production candidates into durable canonical artifacts before any approved external connector.

### MERGE

- Primary Home and Approval navigation with canonical Supabase Revenue state. Implemented in this slice.
- Legacy approval, campaign, workflow and analytics concepts should become adapters/read-only mock labs rather than parallel sources of truth.

### MODIFY

- Home previously used local mock campaign/approval/revenue counts and stated Actual was disconnected despite canonical `revenue_records` support.
- Approval route previously mutated legacy localStorage and Mock Analytics instead of using immutable Supabase approvals.

### RETAIN AS MOCK / DO NOT PRESENT AS PRODUCTION

- Market intelligence fixed signals, AI CEO, AI workforce registry, SNS/Affiliate candidates, content studio, legacy workflow automation, event ledger and Business Memory localStorage flows.

### DO NOT REMOVE YET

- Legacy components remain referenced by Advanced screens and custom verification scripts. Removal requires a separate dependency/data migration after canonical replacements exist.

## Drift assessment

The production-capable portion had drifted toward a manual proposal/revenue recorder while the intended media operating loop remained mock. The immediate operational defect was not missing UI; it was two competing Owner control planes. This slice makes the canonical Supabase workflow authoritative on Home, Approval, Production Revenue and Analytics without deleting legacy labs or weakening external locks.

## Remaining production blockers

1. Remote application and authenticated smoke verification of corrected Migration 008.
2. Real Evidence entered only after genuine external activity.
3. Durable ASP/media offer registry and production intelligence ingestion do not yet exist.
4. Automated scheduling/publishing and platform analytics require Owner-controlled OAuth/provider authorization and a new scoped approval model.
5. Classified operating-cost and Owner-workload capture is incomplete; current net is campaign gross minus campaign-attributed cost.
6. Browser visual QA and deployment runtime remain environment-dependent.

## Change evidence

- Home reads `createRevenueRepository().loadSnapshot()` and derives canonical counts/Actual/next action through `buildCanonicalRevenueOverview`.
- Approval navigation renders `ProductionRevenueWorkspace`; the legacy `ApprovalCenter` is no longer a primary route.
- Actual is displayed only from `revenue_records`; pending Evidence and local mock analytics cannot enter the overview.
- No migration, RLS, trigger, grant or external execution change is included in this slice.
