# LocalStorage to Supabase Migration Plan

## Classification

The existing keys fall into three operational groups:

- UI preference / transient draft: may remain local after validation.
- Legacy mock operational state: preview-only migration candidate.
- Production-critical revenue state: must never remain authoritative in LocalStorage.

Production-critical examples include `kevirio.revenueCampaigns.v1`, `kevirio-revenue-opportunities`, `kevirio-campaigns`, `kevirio-approvals-os`, `kevirio-revenues`, and `kevirio-workflows`.

## Safe migration contract

1. Inventory and parse without modifying LocalStorage.
2. Validate schema, mock markers, provenance, workspace/brand attribution, duplicate keys, and money minor units.
3. Show an Owner preview with included, skipped, rejected, and duplicate counts.
4. Require explicit Owner approval.
5. Import through authenticated Repository/RPC operations only.
6. Record idempotency key and audit entry for every accepted record.
7. Re-read Supabase and compare counts/content.
8. Keep the original local value until the Owner explicitly confirms rollback is no longer needed.

There is intentionally no automatic importer in this change. Existing LocalStorage records have mixed schemas and mock/actual ambiguity; silently copying them would weaken the production data boundary.
