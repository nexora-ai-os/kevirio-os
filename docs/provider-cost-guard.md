# Provider Cost Guard Foundation

All generation requests must enter through `server/providerGateway.js`. The only current production API path is `api/ai.js → openAIProviderGateway → providerGateway → openaiSandboxAdapter`. Direct provider endpoints are rejected by source policy outside a named server adapter or explicit health-check script.

## Execution boundary

- `EXTERNAL_EXECUTION_ENABLED` defaults to false when absent, invalid, or empty.
- Every provider switch also defaults to false.
- A provider switch can never override the global switch.
- Health checks use a separate request class and model allowlist. They do not enable generation.
- Batch execution and autonomous loops are disabled. Concurrency is one.
- External Execution remains LOCKED even after a successful fixture dispatch.

## Request sequence

1. Validate server-derived Workspace and workflow context.
2. Validate global/provider switches and model allowlist.
3. Validate input/output/total tokens and request counts.
4. Load committed usage, active reservations, scoped budgets, and circuit state.
5. Estimate worst-case JPY cost including retry reserve.
6. Require a matching, unexpired, one-time Owner approval when a threshold requires it.
7. Atomically reserve budget and idempotency key.
8. Append a secret-free `reserved` ledger record.
9. Dispatch through a provider adapter.
10. Finalize cost and append the result ledger record. Fail closed on any storage error.

Migration 010 adds the durable policy, allowlist, reservation, ledger, circuit-breaker, and event foundation. It is not remotely applied by this implementation.
# Provider Platform Integration

Cost GuardはPermission／Approval／Policyの後、Budget ReservationとProvider Gatewayの前に固定する。Adapterは費用やApprovalを判断しない。OAuth接続済み状態もCost Guardを迂回する根拠にならない。
