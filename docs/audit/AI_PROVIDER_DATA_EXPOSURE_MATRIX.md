# AI Provider Data Exposure Matrix

| Provider | Runtime send | Possible data | Redaction/routing | Status |
|---|---|---|---|---|
| OpenAI | yes, limited sandbox code | approved mock service package subset | scope/schema; no PII detector | PARTIAL |
| Anthropic | no | none currently | none | CONFIG_ONLY |
| Gemini | no | none currently | none | CONFIG_ONLY |
| Perplexity | no | none currently | none | CONFIG_ONLY |
| Canva | no API | human instruction artifact | none | UI_ONLY |

OpenAI request sets `store:false`; region/subprocessor/training/data deletion capabilityはRepositoryでは確認不能。Sensitivity-based routing、masking、provider allow/deny per recordはない。
