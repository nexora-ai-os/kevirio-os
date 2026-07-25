# Data Source of Truth Map

| Domain | Current source | Classification |
|---|---|---|
| Owner identity | Supabase Auth + owner_profiles | partial production SoT |
| Sandbox usage | Supabase 3 tables | partial production SoT |
| Market signals | source-controlled mockMarketSignals | MOCK_ONLY |
| Opportunities/decisions | generated mock + localStorage | DANGEROUS_SOURCE_OF_TRUTH |
| Campaigns/packages/artifacts | localStorage | DANGEROUS_SOURCE_OF_TRUTH |
| Approvals/workflows/tasks | multiple localStorage collections | DANGEROUS_SOURCE_OF_TRUTH |
| Business Memory | localStorage | DANGEROUS_SOURCE_OF_TRUTH |
| Revenue forecast | mock/localStorage | MOCK_ONLY |
| Actual revenue | none; UI value defaults/legacy state | NOT_IMPLEMENTED |
| Audit/event ledger | static mockEventLedger | MOCK_ONLY |
