# Component Map

| Page key | Component | Purpose | Data | Classification |
|---|---|---|---|---|
| `home` | RevenueCommandCenter | Revenue overview/action queue | localStorage + mock ledger | MOCK_WORKING |
| `campaign` | RevenueCampaignFoundation, CampaignOS | campaign/package generation | localStorage/mock | MOCK_WORKING |
| `review` | SupabaseOwnerAuthGate + OwnerReviewWorkspace | review/export/sandbox | auth + localStorage + limited OpenAI | PRODUCTION_PARTIAL |
| `ceo` | AICEO | brief/governance/registry | deterministic local | UI_ONLY |
| `apiCenter` | APIControlCenter | readiness/model routing display | registry/local calc | UI_ONLY |
| `memory` | BusinessMemory | memory/journal edit | localStorage | MOCK_WORKING |
| `opportunity` | MarketIntelligence | rank/top3/decision/handoff | fixed mock signals + localStorage | MOCK_WORKING |
| `trends` | TrendIntelligence | trend analysis | mock/localStorage | MOCK_WORKING |
| `workflows` | WorkflowAutomation | simulated automation | local state/timers | MOCK_ONLY |
| `dashboard` | Dashboard | legacy mission dashboard | localStorage | LEGACY |
| `workEngine` | WorkEngine | simulated work items | localStorage/timer | MOCK_ONLY |
| `work` | WorkCommand | legacy pipeline | localStorage | LEGACY |
| `affiliate` | AffiliateHub | affiliate preparation | mock/localStorage | MOCK_ONLY |
| `content` | ContentStudio | draft/approval preparation | localStorage | MOCK_WORKING |
| `approval` | ApprovalCenter | legacy approval mutation | localStorage | MOCK_WORKING |
| `analytics` | Analytics | forecast/actual display | localStorage; actual defaults 0 | MOCK_WORKING |
| `operations` | OperationCommandCenter | ops summary | mock/localStorage | UI_ONLY |
| `assistant` | AIAssistant | local assistant | local mock/localStorage | MOCK_WORKING |
| `settings` | Settings | reset/readiness | localStorage | PARTIAL |

主要UX所見: 18 page keysと新旧Revenue/Legacy画面が併存し、Ownerの主要導線が分散。全画面に共通loading/error/empty/accessibility設計はない。初回監査時のPowerShell既定encodingでは文字化けしたが、UTF-8明示読取でSource文字列は正常と再確認した。
