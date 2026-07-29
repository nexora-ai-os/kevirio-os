# Provider Error Model

共通分類はconfiguration、credential、authentication、authorization、scope、permission、account mismatch、token、refresh、revoked、invalid request、model、rate limit、quota、billing、budget、cost、policy、approval、circuit、unavailable、timeout、network、response、ledger、reservation、internalである。

UIとAuditには正規分類と安全なProvider codeだけを渡す。raw response、Authorization header、token、prompt本文、OAuth codeは保存しない。401/403/billing/quota/policy/budgetは再試行しない。429はRetry-Afterと再予約が揃う場合のみ最大1回である。
