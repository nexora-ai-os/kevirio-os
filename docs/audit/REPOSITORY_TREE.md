# Repository Tree

追跡対象165ファイル。`node_modules/`, `dist/`, `.vercel/`, `.env.local`, logは非追跡/除外。

```text
/
├─ src/
│  ├─ main.jsx                 React browser entry
│  ├─ App.jsx                  SPA composition / in-memory + localStorage state hub
│  ├─ components/              38 JSX UI modules + shared UI
│  ├─ services/                43 domain/service modules
│  ├─ data/                    20 mock/schema/registry modules
│  └─ hooks/useLocalStorage.js generic JSON localStorage hook
├─ api/
│  ├─ ai.js                    mock AI + authenticated OpenAI sandbox endpoint
│  ├─ orchestrate.js           local-mock orchestration endpoint
│  └─ status.js                sandbox-only status endpoint
├─ server/
│  ├─ localDevServer.js        Vite middleware + /api/ai local runtime
│  ├─ openaiSandboxAdapter.js  OpenAI Responses adapter
│  ├─ verifiedOwnerContext.js  bearer/origin/profile verification
│  └─ supabase*.js             server client and usage adapter
├─ supabase/migrations/
│  ├─ 001_revenue_activation.sql
│  └─ 002_reusable_sandbox_reservations.sql
├─ scripts/                    21 bespoke verify-*.mjs scripts
├─ docs/                       architecture/workflow documents
├─ middleware.js               Vercel-style Basic Auth middleware
├─ package.json                Vite/React/Supabase; four scripts only
└─ index.html                  Vite HTML entry
```

存在しない主要Directory: `pages`, `features`, `stores`, `context`, `providers`, `adapters`（名称上）、`agents`, `workflows`, `prompts`, `schemas`, `types`, `tests`, `e2e`, `.github/workflows`。

## Production relevance / risk

| Area | Responsibility | Caller | Data source | Relevance | Risk |
|---|---|---|---|---|---|
| `src/App.jsx` | 全画面・状態の集約 | `main.jsx` | localStorage/mock | High | 巨大State hub、App全体Authなし |
| `src/components` | Owner UI | App | props/localStorage/mock | High | 表示と実接続の混同 |
| `src/services` | Domain計算/guard | Components/scripts | deterministic mock | High | 多数が永続化/外部接続なし |
| `api/ai.js` | Mock/Live sandbox | Browser gateway | Supabase/OpenAI | High | Liveは限定的、その他はmock |
| `supabase/migrations` | Owner/Sandbox usage | Server | Supabase | High | Business schemaなし |
| `scripts` | Contract verification | Manual node | fixtures/source assertions | Medium | Test runner/CI非統合 |
