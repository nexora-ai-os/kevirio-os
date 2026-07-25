# Owner Required Actions

実装前にSecretをChat、Issue、Commit、Screenshotへ貼らない。

## 1. Supabase remote schema確認（今すぐ必要）

1. Supabase Dashboard →対象Project→SQL Editor/Migrationsを開く。
2. `001`, `002`が適用済みか履歴を確認する（未確認のまま再実行しない）。
3. 入力はRepository migration SQLのみ。Secret値はSQL Editorへ貼らない。
4. 4 tables/3 RPCとRLSが表示されれば成功。
5. 失敗時はmigration errorと適用versionだけを共有し、key/tokenは共有しない。

## 2. Vercel Environment確認（OpenAI Sandbox smoke前）

1. Vercel Project → Settings → Environment Variables。
2. Server variablesと`VITE_` public variablesをPreview/Production別に確認。
3. SecretはSource、GitHub Issue、client-prefixed variableへ貼らない。
4. Deploy logでmissing-config errorがなく、Owner authがlocked/readyを正しく表示すれば成功。
5. 変更後はredeployが必要。

## 3. Provider/OAuth

OpenAI keyは限定Sandbox smoke時のみ必要。他Provider key、Canva/Google OAuth、SNS、課金、Production deploy confirmationは現在のP0実装完了後でよい。監査中に外部送信/OAuth/課金は実行していない。
