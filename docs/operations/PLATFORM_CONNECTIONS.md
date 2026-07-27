# Platform Connections

| Provider | 現在 | 実行可否 | Owner action |
|---|---|---|---|
| Manual export | DRY-RUN READY | Copy/Downloadのみ | 承認済み内容を外部で手動使用 |
| Google | OWNER AUTH REQUIRED | LOCKED | 将来、公式OAuthを許可 |
| Meta | OWNER AUTH REQUIRED | LOCKED | 将来、公式OAuthと権限を許可 |
| TikTok | OWNER AUTH REQUIRED | LOCKED | 将来、公式OAuthと権限を許可 |
| Email / Payment | ADAPTER UNAVAILABLE | LOCKED | 現時点で操作なし |

接続行にはSecretを保存しません。`production_ready`であっても`external_execution_allowed=false`の間は実行不能です。現在は全Providerがfalseです。

