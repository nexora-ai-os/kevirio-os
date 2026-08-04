# KEVIRIO V1 Operations Runbook

## Operating boundary

KEVIRIO V1 is Owner-operated. External Execution is LOCKED. Publishing, sending, account changes and other external effects remain manual Owner actions.

Actual Revenue requires verified Evidence and Owner approval. Forecast, Mock, Test, Unknown and zero remain distinct.

## First day

1. Confirm Owner login, active Owner profile and one unambiguous Workspace.
2. Confirm all ten Production routes and `/api/status` are healthy.
3. Confirm Global and Provider switches are false.
4. Review pending Approval items and their exact snapshots.
5. Select one real Offer or service opportunity.
6. Generate one Manual Execution Package.
7. Owner manually publishes, sends or performs the package outside KEVIRIO.
8. Record the stable external source reference and Actual Cost.
9. Register Evidence as a candidate.
10. Approve the exact Evidence snapshot and record Actual Revenue only after verification.
11. Verify Net Profit within the same currency.

## First week

- Operate one bounded revenue experiment at a time.
- Prefer the manual service/offer route because it requires no external adapter.
- Review Affiliate terms and disclosure before placing a real link.
- Publish SEO/SNS/WordPress/note/YouTube material manually only after Owner review.
- Record source references, costs and outcomes on the day they occur.
- Generate learning only from recorded performance; treat it as inference.
- Do not unlock Provider execution to increase throughput.

## Daily checks

- Owner login and Workspace context.
- Company State and Next Owner Action.
- Pending/expired Approvals.
- Manual packages awaiting Owner action.
- Evidence candidates awaiting verification.
- Verified Actual Revenue by currency.
- Actual Cost by currency.
- Net Profit by currency.
- Failed workflows and sanitized audit events.
- Cost Guard budget, reservation, ledger and circuit state.
- Provider readiness without reading credentials.
- External Execution remains LOCKED.

## Weekly checks

- Revenue, Cost and Net Profit by currency and source.
- Evidence rejection, expiry and duplicate rate.
- Offer-to-package, package-to-manual-action and action-to-Evidence conversion.
- Approval turnaround and expired snapshots.
- AI Employee output acceptance and rejected-risk count.
- Cost Guard headroom and unused reservations.
- Production errors, timeouts and authorization failures.
- Deferred V2 requests remain outside V1.

## Incident handling

### Security or credential exposure

1. Stop affected access.
2. Do not copy the credential into chat, logs or tickets.
3. Rotate through the authorized Provider/Supabase console.
4. Verify repository and browser outputs remain redacted.
5. Keep Provider and Global switches false.

### Cross-Workspace or RLS anomaly

1. Stop all mutations.
2. Preserve audit evidence.
3. Verify Owner profile, membership and Workspace identifiers read-only.
4. Do not bypass RLS or use browser-side filtering as a fix.

### Approval or Evidence anomaly

1. Stop Actual Revenue finalization.
2. Preserve the immutable snapshot and source reference.
3. Check expiry, one-time use, version/hash and Workspace alignment.
4. Reject or recreate through the protected workflow; never edit history.

### Revenue discrepancy

1. Separate currencies.
2. Compare Evidence source, gross amount, cost and occurrence date.
3. Treat missing values as Unknown, not zero.
4. Do not alter verified records without an approved integrity procedure.

### Provider or Cost Guard failure

1. Fail closed.
2. Record only normalized error classes.
3. Release eligible reservations.
4. Do not bypass budgets, quotas, circuit breakers or Approval.

## Cost review

- Compare estimates, reservations and Actual Cost separately.
- Investigate stale reservations and pricing freshness.
- Never infer zero cost from missing ledger data.
- Keep Provider model, workflow and Workspace budgets enforced.

## Revenue review

- Count only verified `revenue_records` as Actual.
- Keep Affiliate commission Evidence distinct from Forecast.
- Do not aggregate currencies before an approved conversion source exists.
- Reconcile Net Profit only when Revenue and Actual Cost currencies match.

## AI Employee review

- Confirm every task is Workspace-scoped and bounded.
- Review maturity, Provider, Approval, missing scope, cost ceiling and output type.
- MOCK_READY employees produce proposals/artifacts only.
- Google Operations remains CONDITIONAL and Dry Run unless separately activated after V1.
- No AI Employee may grant Approval, record Actual Revenue, read credentials or release emergency stops.

## Approval review

- Prioritize pending items by evidenced impact and deadline.
- Confirm target, version/hash, expiry, cost/risk and consequence.
- Approval does not execute externally.
- Changed content requires a new snapshot and Approval.

## Operational success condition

V1 is operating correctly when the Owner can move a genuine opportunity through Approval, Manual Execution, Evidence, Actual Revenue, Actual Cost, Net Profit and learning without bypassing any security or truth boundary.

## Affiliate Intelligence V1.1 candidate operation

1. Operationsで実Offerが存在することを確認する。
2. 「運用準備」から`/operations/offers/:offerId/preparation`を開く。
3. ASP、成果条件、Compliance、素材参照、Target、訴求、Channel、Evidence計画をDraft保存する。
4. Owner確認後に運用準備を完了し、既存Approval / Manual Execution Packageへ進む。
5. 公開はOwnerが外部で手動実行する。A8.netログイン、取得、投稿をKEVIRIOから自動実行しない。
6. Evidence承認後だけ既存`revenue_records`へActual Revenueを確定する。Actual Costは既存`operating_cost_records`を使う。

Migration 014は未適用candidateである。適用には別途Owner承認、backup/PITR確認、pre-check、one-time apply、post-smokeが必要。Migration未適用時はAffiliate専門readが空表示となるが、既存Offer運用は維持する。

Stop conditions: Workspace/RLS anomaly、credential/tracking secret露出、External Execution true、ActualとForecast/Inferenceの混同、既存Offer IDの変更、Migration部分適用。
