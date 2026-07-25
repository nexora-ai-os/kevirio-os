# Entry Point Map

## Browser/React

`index.html` → `src/main.jsx:6` → `src/App.jsx:66` → `Sidebar`の内部page state → component。React RouterはないためURL route、deep link、protected routeは存在しない。

## Runtime

Development:

```text
npm run dev
→ Vite SPA only
```

Full local:

```text
npm run dev:full
→ server/localDevServer.js
→ Vite middleware
→ /api/ai
```

Production候補:

```text
Vercel middleware.js (Basic Auth)
→ static Vite bundle / api/*.js
```

`vercel.json` とGitHub Actionsは存在しない。`middleware.js`の実デプロイ適用はRepositoryだけでは `NOT VERIFIED`。

## Auth

App全体 → Authなし。`page === review` のみ `SupabaseOwnerAuthGate` → session restore → password login → token getter → OwnerReviewWorkspace → `/api/ai` → server-side token verification → `owner_profiles`。

## AI

通常UI → `/api/ai`または`/api/orchestrate` local mock。限定Sandbox → `/api/ai` → verified owner/origin → usage reservation → OpenAI Responses API → JSON schema validation → usage commit/cache。
