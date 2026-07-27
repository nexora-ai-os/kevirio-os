# External Execution Boundary

- Migration 009はHTTP、SNS、Email、Payment、OAuth、課金APIを呼びません。
- `campaigns`、`offer_operations`、`execution_packages`、`platform_connections`の実行許可はfalseです。
- Manual PackageはOwner-safe Markdown/JSONデータで、内部UUID、token、prompt、Business Memoryをdefault copyへ含めません。
- Content承認は既存`decide_approval`のimmutable snapshot一致が必須です。同一Approvalは一度しか決定できず、Package keyは`manual-package:<approval>`で重複しません。
- Browserに新テーブルのINSERT/UPDATE/DELETE権限はありません。Owner membershipを確認するSecurity Definer RPCだけが書込みます。
- Provider接続情報には状態とsafe detailsだけを保存し、credentialは保存しません。

