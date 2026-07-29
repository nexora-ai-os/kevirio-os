# Provider Budget Policy

Priority is: validated runtime environment override → durable Workspace policy → safe default. Missing, negative, non-numeric, unavailable usage, unavailable pricing, or ledger failure always blocks the request.

| Guard | Safe default |
|---|---:|
| Maximum per request | ¥5 |
| Hourly | ¥20 |
| Daily | ¥100 |
| Monthly | ¥1,000 |
| Input tokens | 4,000 |
| Output tokens | 800 |
| Total tokens | 4,800 |
| Requests per job | 1 |
| Requests per workflow | 3 |
| Concurrency | 1 |
| Automatic retries | Maximum 1 |

Workflow, AI employee, and Workspace budgets must be available from durable policy/runtime state; absence is a hard stop. Active reservations are included in every projection so concurrent requests cannot spend the same budget.

Threshold actions:

- 50%: notification event
- 75%: stop nonessential automation
- 90%: matching Owner approval required
- 100%: hard stop

Authentication, authorization, billing, quota, policy, budget, model, Workspace, and ledger errors are non-retryable. A 429 can retry once only with a valid `Retry-After`, confirmed idempotency, and a fresh Cost Guard evaluation. Timeout retry is prohibited when idempotency cannot be confirmed.

Model discovery never grants generation access. Generation and health-check allowlists are separate. Dynamic `latest` aliases are forbidden. Gemini health checks use `gemini-2.5-flash`; the initial generation allowlist for Gemini remains empty.
# Provider Platform Integration

Provider、model、Workspace、Workflow、AI Employeeごとのreservationを共通Runtime Adapterから処理する。料金Versionと為替Versionが不明なrequestは拒否し、Owner承認なしで単価や上限を変更しない。
