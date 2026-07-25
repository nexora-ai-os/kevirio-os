# Sensitive Data Flow Map

```text
Owner credentials → Supabase Auth (TLS assumed, live not verified)
Session token → browser memory → Authorization header → /api/ai
Server keys → process environment → Supabase/OpenAI SDK/request
Approved mock package subset → OpenAI Responses API
Provider output → strict JSON validation → Supabase cache + browser UI
Business Memory/campaigns → plaintext localStorage (no server backup/isolation)
```

Query stringへcredentialを入れるコードは確認されない。Analytics/error-reporting third partyは未実装。Export/manual document/clipboard pathsにはclassification/masking/auditがない。
