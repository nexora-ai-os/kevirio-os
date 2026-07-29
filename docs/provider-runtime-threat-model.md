# Provider Runtime Threat Model

| Threat | Control |
|---|---|
| Missing/forged enablement | Global and provider switches default false; server-only evaluation |
| Cost explosion | Per-request/hour/day/month/workflow/employee/workspace projections include reservations |
| Parallel overspend | Concurrency one plus transactional advisory lock and reservation |
| Infinite retry | Maximum one, non-retryable billing/quota/policy errors, idempotency requirement |
| Expensive or moving model | Explicit allowlist, verified pricing, no `latest`, high-cost approval |
| Approval replay | Expiry, exact snapshot fields, one-time use, unique approval reservation |
| Cross-workspace request | Server-derived Workspace match, foreign keys, RLS, Owner membership read policy |
| Missing ledger | Request is never dispatched |
| Secret/prompt leakage | Ledger stores hashes and metadata only; source and credential checks remain active |
| Provider outage loop | Circuit breaker opens after governed failure handling; open state blocks preflight |
| Browser mutation | Tables are SELECT-only to authenticated; RPCs are service-role only |
| Gateway bypass | API route imports the gateway; source policy rejects direct endpoint and adapter imports |

Residual risk: Migration 010 is local only. Until it is remotely applied and a server-only runtime store is connected, the Gateway deliberately returns a locked/usage-unavailable result and cannot dispatch generation.
# ADR-PIP-001 Extension

OAuth state replay、callback substitution、Workspace swapping、encrypted token theft、account mismatch、scope escalation、Adapter bypassを追加脅威とする。対策はone-time state、PKCE、完全一致Redirect allowlist、Owner/Workspace/Provider binding、AES-256-GCM ciphertext、Capability manifest、Gateway static policyである。暗号鍵・Policy・Pricing・Ledger・Reservationが不明なら停止する。
