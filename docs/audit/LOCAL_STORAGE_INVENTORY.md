# Local Storage Inventory

`App.jsx`だけで33 keys、追加service/UI keysが存在する。JSON validationはdomain-specificな一部のみ。暗号化、TTL、owner/workspace namespaceはない。

| Keys/group | Purpose | Classification |
|---|---|---|
| `nexora-*` (programs, approvals, analytics, draft, notifications, todos, chat, opportunities, pipeline-runs) | legacy app state | LEGACY / MIGRATE |
| `kevirio-revenue-*`, `kevirio.revenueCampaigns.v1`, campaign handoff/decision/review/export/evidence keys | Revenue Core | DANGEROUS_SOURCE_OF_TRUTH |
| `kevirio-business-memory`, `kevirio-memory-records`, `kevirio-decision-journal` | confidential memory | DANGEROUS_SOURCE_OF_TRUTH |
| `kevirio-workflows`, tasks/work-items/mission | workflow | MIGRATE_TO_SUPABASE |
| `kevirio-approvals-os`, approvals | approvals | MIGRATE_TO_SUPABASE |
| `kevirio-revenues`, `kevirio-forecasts`, analytics | revenue display | MOCK/LEGACY |
| `kevirio-api-statuses`, integrations, departments, modes, agents | config/UI | DEVELOPMENT_ONLY |
| `kevirio-pending-ai-message` | transient navigation message | TEMPORARY_DRAFT_OK |

Reset functionは全keyを消しておらず、完全削除ではない。Browser user/profile間分離もない。
