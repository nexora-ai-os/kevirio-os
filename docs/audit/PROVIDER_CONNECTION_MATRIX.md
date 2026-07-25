# Provider Connection Matrix

| Provider | Status | Adapter/endpoint | Health | Production readiness |
|---|---|---|---|---|
| OpenAI | PRODUCTION_PARTIAL | Responses API sandbox adapter `/api/ai` | contract scripts only; real call not run | owner/origin/budget/schema/timeout/retryあり、publish/revenueなし |
| Anthropic/Claude | CONFIG_ONLY | none | none | NOT READY |
| Gemini | CONFIG_ONLY | none | none | NOT READY |
| Perplexity | CONFIG_ONLY | none | none | NOT READY |
| Canva | UI_ONLY/CONFIG_ONLY | instruction artifact only | none | NOT READY |
| Google APIs/OAuth | NOT_IMPLEMENTED | none | none | NOT READY |
| Supabase | PRODUCTION_PARTIAL | browser/server client, RPC | dummy/config verification; live DB not queried | Auth/Sandboxのみ |
| GitHub | NOT_IMPLEMENTED | none | none | NOT READY |
| Vercel | CONFIG_ONLY | `api/`, middleware convention | deployment not verified | NOT VERIFIED |

OpenAI model policyはserver側固定。Structured JSON schema、Abort timeout、最大1 retry、429/5xx handling、usage/cost reservation/cacheあり。Streamingなし。Provider fallbackなし。
