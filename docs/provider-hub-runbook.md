# Provider Hub Runbook

1. Owner Authと対象Workspaceを確認する。
2. Provider HubでCredential、Connection、Permission、Cost、Circuit、Executionを別々に確認する。
3. Migration未適用は「接続情報なし」と表示され、実行は停止する。
4. Dry RunでProvider、model、token、最大費用、scope、Approvalを確認する。外部通信件数は0でなければ失敗とする。
5. Circuit open、stuck reservation、refresh failure、account mismatchはProviderをsuspendし、Global lockを維持する。

Recovery: 原因を修正し、fixture test、Security test、DB validationを再実行する。lockの解除はOwnerの別決定があるまで行わない。
