# Supabase Schema Inventory

Repository migrationから確認できる表は4つのみ。Remote DB適用状態は `NOT VERIFIED`。

| Table | Purpose | PK/FK | RLS | Paths | Risk |
|---|---|---|---|---|---|
| `owner_profiles` | active owner allowlist | owner_id→auth.users | self select | verifiedOwnerContext read | single role only |
| `sandbox_usage_monthly` | monthly cost counters | owner_id+month | self select | server RPC | month text |
| `sandbox_request_reservations` | idempotent budget reservation | UUID; owner FK; idempotency unique | enabled, no client policy | service RPC | global idempotency key |
| `sandbox_generation_cache` | result cache | cache_key; owner FK | self select | server adapter | JSON payload sensitivity/retention |

Requested business tables (`profiles`, `workspaces`, `workspace_members`, `brand_profiles`, `opportunities`, `campaigns`, `approvals`, `revenue`, `workflow`, `artifacts`, `tasks`, `business_memory`, `provider_usage`, `audit`, `errors`)は存在しない（`owner_profiles`のみ類似）。

IndexはPK/unique由来のみ。updated timestamp triggerなし。Business FK、workspace separation、audit/error persistenceなし。
