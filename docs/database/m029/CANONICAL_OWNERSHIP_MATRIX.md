# M029 Canonical Ownership Matrix

M029 is additive. It does not replace any M001-M028 source of truth. `operational_objects`
continues to own only `QUICK_CAPTURE` and `RESEARCH_PACKAGE`.

| Domain | Canonical table / ID | Owner and Workspace | Mutation contract | Draft | Timeline / link | Lifecycle / delete | Member / AI | Search source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GOAL | `campaigns.id` | `data_owner_id`, `workspace_id`, PRIVATE default | M029 create/update/archive, expected version | canonical draft | M028 event/link | existing campaign states; archive=`cancelled`; no hard delete | self only; AI L0-L2 | campaigns |
| STRATEGY | `owner_decisions.id` | `decided_by`, `workspace_id`, PRIVATE default | M029 create/update/archive, expected version | canonical draft | M028 event/link | active/superseded; no hard delete | self only; AI L0-L2 | owner_decisions |
| WORK | `tasks.id` | `data_owner_id`, `workspace_id`, PRIVATE default | M029 create/update/archive, expected version | canonical draft | M028 event/link | existing task states; archive=`cancelled` | self only; AI L0-L2 | tasks |
| APPLICATION | `opportunities.id` | `created_by`, `workspace_id`, PRIVATE default | M029 create/update/archive, expected version | canonical draft | M028 event/link | existing opportunity states; archive=`expired` | self only; AI L0-L2 | opportunities |
| CLIENT | `clients.id` | `data_owner_id`, `workspace_id`, PRIVATE default | M029 create/update/archive, expected version | canonical draft | M028 event/link | active/inactive/archived | self only; AI L0-L2 | clients |
| CONTENT | `personal_operational_records.id` where `record_type=CONTENT` | existing `data_owner_id`, `workspace_id`, visibility | version-aware M029 update/archive; existing create remains compatible | canonical draft | M028 event/link | DRAFT/ACTIVE/ARCHIVED; no hard delete | existing private policy; AI L0-L2 | personal records |
| SNS_ITEM | `content_assets.id` | `data_owner_id`, `workspace_id`, PRIVATE default | M029 update/archive, expected version; creation requires existing canonical revenue/market context | canonical draft | M028 event/link | existing content states | self only; AI L0-L2 | content_assets |
| KNOWLEDGE | `business_memory_records.id` | `data_owner_id`, `workspace_id`, PRIVATE default | M029 create/update/archive, expected version | canonical draft | M028 event/link | active/deletion_requested/deleted; archive uses deletion_requested | self only; AI L0-L2 | business_memory_records |
| IMPROVEMENT | `personal_operational_records.id` where `record_type=FEEDBACK` | existing private owner/workspace | version-aware M029 update/archive; existing create remains compatible | canonical draft | M028 event/link | DRAFT/ACTIVE/ARCHIVED | existing private policy; AI L0-L2 | personal records |
| AFFILIATE | `affiliate_program_master.id` | existing M025/M026 owner/workspace | existing protected RPC only | M027 draft | M028 event/link | existing business lifecycle | existing contract | affiliate master |
| REVENUE | `revenue_records.id` | existing workspace/evidence boundary | existing evidence-gated RPC only | none | M028 link only | immutable/correction contract | existing contract | revenue records |
| EVIDENCE | `evidence_candidates.id` | existing workspace/submitter boundary | existing protected registration/verification | none | M028 link where resolver permits | existing verification lifecycle | existing contract | evidence candidates |
| RESEARCH | `research_sources.id`, `research_findings.id` | M028 owner/personal workspace | existing service-only FREE-cost RPC | research package draft only | M028 event/link | ACTIVE/SUPERSEDED/ARCHIVED | browser read, service write | M028 research tables |
| QUICK_CAPTURE | `operational_objects.id` | M028 owner/personal workspace | existing M028 protected RPC | M028 draft | M028 event/link | ACTIVE/ARCHIVED | self only; AI L0-L2 | operational objects |

Conversion is idempotent and may create only the canonical target identified above. It never
creates Revenue, Evidence, Affiliate truth, or external execution.
