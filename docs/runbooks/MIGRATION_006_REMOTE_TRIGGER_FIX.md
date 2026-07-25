# Migration 006 Remote Trigger Fix

## Root cause

Migration 003 attached `public.enforce_revenue_workspace_integrity()` to eleven tables with different row types. The function directly dereferenced fields such as `NEW.opportunity_id`, `NEW.brand_id`, and `NEW.client_id`. PostgreSQL raised `42703` when the shared trigger ran for a relation whose `NEW` record did not contain one of those fields. The first `create_revenue_candidate` insert targets `opportunities`, which has no `opportunity_id`.

Migration 006 converts `NEW` to JSONB once, reads optional table-specific identifiers from that representation, and then applies the same or stronger workspace/entity checks under explicit `TG_TABLE_NAME` branches. No domain column is added and RLS remains enabled.

It also makes the twelve Production Revenue read grants reproducible: `authenticated` receives `SELECT` only, while direct mutations remain unavailable and protected writes continue through authenticated security-definer RPCs.

## Apply

1. Supabase DashboardでKEVIRIO projectを開く。
2. SQL Editorで `supabase/migrations/006_revenue_integrity_trigger_fix.sql` 全文を実行する。
3. `Success. No rows returned` を確認する。
4. KEVIRIOを再読み込みし、Owner Sessionがverifiedであることを確認する。
5. Production Revenueで「Production candidateを作成」を1回押す。
6. Campaignsが1、Pending approvalsが1以上になり、Workflowが`owner_artifact_approval`で停止することを確認する。
7. 同じボタンをもう一度押し、Campaignsが増えないことを確認する。
8. External Executionが`LOCKED`、Actual RevenueがEvidence承認前は`¥0`のままであることを確認する。

Secret、JWT、service role key、API keyをSQL Editor、画面、consoleへ貼らない。
