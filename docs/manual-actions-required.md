# Manual Actions Required

No action below was performed by the audit.

1. Gemini: Google AI Studio / Cloud Consoleで対象KeyのAPI制限、Generative Language API有効化、Project紐付けを確認する。Key値は共有しない。
2. Vercel: `kevirio-os`をRepositoryへlinkし、必要な変数名をDevelopment / Preview / Productionへ登録する。値はVercel UIへ直接入力する。
3. Google OAuth: Callback実装、暗号化Token保存、state/PKCE、失効処理の完成後にClientを作成・認可する。
4. Canva: 同じOAuth基盤完成後、Callback URIを登録し、Ownerが`profile:read`から段階的に認可する。
5. GitHub: PushまたはPR作成を承認した時だけCLI認証を行う。
6. OpenAI: Production Executionは解放せず、既存Owner承認・予算・idempotency付きSandboxのみを維持する。

Anthropic、Perplexity、GeminiはCredential確認だけではProduction-readyではありません。Server-only Adapter、入力データ分類、コスト制限、監査、Owner Approvalが必要です。
