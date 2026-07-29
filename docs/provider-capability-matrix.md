# Provider Capability Matrix

| Provider | Auth | Capability | Initial permission | Maturity | Execution |
|---|---|---|---|---|---|
| OpenAI | API key | text generation | none | Locked | LOCKED |
| Anthropic | API key | text generation | none | Locked | LOCKED |
| Gemini | API key | health/text | health fixture | Conditional | LOCKED |
| Perplexity | API key | research/text | fixture | Conditional | LOCKED |
| Google | OAuth | Gmail/Drive/Calendar/Analytics/Search Console/YouTube | read-only scopes | Conditional | LOCKED |

Google Operations AI EmployeeがCapability manifestを消費する。read-onlyもOwner GO前はConditionalである。
| Canva | OAuth | design read/create/export | read-only first | Conditional | LOCKED |

Capability manifestとOAuth granted scopesの両方を満たさない操作は拒否する。
