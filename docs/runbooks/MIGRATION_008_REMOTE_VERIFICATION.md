# Migration 008 Remote Verification

Apply `supabase/migrations/008_revenue_mvp_completion.sql` in the Supabase SQL Editor as one transaction.

Then reload KEVIRIO and verify:

1. Production Revenue shows a Japanese sales-ready package title instead of `Untitled campaign`.
2. Preview shows all ten Owner sections; Copy produces Markdown; Markdown and JSON downloads contain Owner-safe content.
3. Copy or download moves the workflow to `Evidence待ち` without any external execution.
4. Register one real Evidence reference, integer gross/cost minor units, ISO currency and actual occurrence date.
5. Approve the immutable Evidence snapshot, then press `Actual確定`.
6. Analytics shows gross, cost and net from the new canonical `revenue_records` row after reload.

Expected safe failures:

- Duplicate reference: operation stops without a second Evidence candidate.
- Missing or mismatched approval: operation stops without a Revenue Record.
- Migration not applied: UI shows a safe Japanese repository error.

When reporting a failure, share the visible Japanese message, the operation name, and Supabase PostgreSQL error code/message only. Do not share tokens, `.env.local`, request headers, or session payloads.
