# Manual Actions Required

No action below was performed by the audit.

1. Gemini: Developer API Keyの認証とモデル一覧取得は成功。`generateContent`は1回だけ実行し、429 `RESOURCE_EXHAUSTED`だったため、Google AI Studioで対象ProjectのQuota／利用枠を確認する。Key値は共有しない。Google Cloud Agent Platform用Keyとは混同しない。
2. Vercel: `kevirio-os`をRepositoryへlinkし、必要な変数名をDevelopment / Preview / Productionへ登録する。値はVercel UIへ直接入力する。
3. Google OAuth: Callback実装、暗号化Token保存、state/PKCE、失効処理の完成後にClientを作成・認可する。
4. Canva: 同じOAuth基盤完成後、Callback URIを登録し、Ownerが`profile:read`から段階的に認可する。
5. GitHub: PushまたはPR作成を承認した時だけCLI認証を行う。
6. OpenAI: Production Executionは解放せず、既存Owner承認・予算・idempotency付きSandboxのみを維持する。

Anthropic、Perplexity、GeminiはCredential確認だけではProduction-readyではありません。Server-only Adapter、入力データ分類、コスト制限、監査、Owner Approvalが必要です。

## Provider Cost Guard

Remote executionを将来検証する前に、Ownerは`supabase/migrations/010_provider_cost_guard_foundation.sql`をSupabase SQL Editorで適用し、`Success. No rows returned`を確認してください。今回は適用しません。適用後も全Execution switchはfalseのままで、Runtime Store接続とOwner承認が完了するまで生成Requestは停止します。
# Provider Integration Platform（実装後）

1. `supabase/migrations/011_provider_integration_platform.sql`をSQL Editorで適用する（現時点では未適用）。
2. `Success. No rows returned`を確認する。
3. VercelへOAuth暗号鍵、Redirect base URL、Google／Canva credentialを値を共有せず登録する。
4. Google／Canva Consoleへ各Callback URIを登録する。
5. Owner Auth状態でProvider Hubの復元を確認する。
6. OAuth認可、Provider実API、Production unlockは別のOwner判断まで実行しない。
# Google Operations AI Employee
1. `supabase/migrations/012_ai_employee_platform.sql`をSQL Editorで適用する。
2. Success後、Google OAuthとread-only smokeは別手順で実施する。
3. write/send/publish switchesは変更しない。
