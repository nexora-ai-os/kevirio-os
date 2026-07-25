# Migration 005 Remote Verification Runbook

## Owner operation

1. Supabase DashboardでKEVIRIO projectを開く。
2. SQL Editorで `supabase/migrations/005_revenue_repository_integration.sql` の内容を実行する。
3. KEVIRIOへOwnerとして再ログインする。
4. 左ナビの **Production Revenue** を開く。
5. Workspaceが `KEVIRIO Owner Workspace`、Brandが `KEVIRIO` と表示されることを確認する。
6. **Production candidateを作成** を1回押す。同じボタンを再度押しても件数が増えず、既存結果になることを確認する。
7. Approval Queueで `internal_artifact` を承認する。
8. 外部作業をOwnerが手動で完了した後だけ、実在する請求・入金参照をEvidence Inboxへ入力する。
9. `actual_revenue_verification` を承認し、**Actual確定**を押す。
10. Verified net actualがEvidence金額−Costと一致することを確認する。

## Fail-closed checks

- Migration未適用時は `Remote repositoryを確認できません` または操作失敗が表示される。
- Session切れではデータが取得されない。
- External executionは常に `LOCKED` のまま。
- Mock recommendation自体をActual Evidenceとして入力しない。
- Secret、service role、JWT、API keyはSQL Editor、フォーム、consoleへ貼らない。

## SQL verification (values are not secrets)

`authenticated` に対して `create_revenue_candidate` と `register_revenue_evidence` のexecuteがあること、`anon` にはないことをDashboardのfunction grantsで確認する。RLSはMigration 003の全business tablesで有効なままにする。
