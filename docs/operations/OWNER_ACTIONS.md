# Owner Actions

## 今必要な操作

1. Supabase Dashboard → SQL Editor → New queryを開く。
2. `supabase/migrations/009_canonical_offer_operations.sql`全体を貼り付け、Runを1回押す。
3. `Success. No rows returned`を確認する。失敗時は再実行せず、PostgreSQL code / message / contextだけを共有する（SQL内データやSecretは共有しない）。
4. アプリをReloadし、`Offer Operations`が空状態で表示され、External ExecutionがLOCKEDであることを確認する。

## 後で必要になる操作

- 実Offer情報の登録。
- Google / Meta / TikTok等の公式接続を実装・利用する時点でのLogin、OAuth、API key、契約判断。
- GitHub Push / Vercel Production反映の承認。
- 生成内容の公開前最終承認と、実Evidenceの登録。

Secret、token、service-role keyはChat、Issue、Source、Screenshot、`VITE_*`へ入力しません。

