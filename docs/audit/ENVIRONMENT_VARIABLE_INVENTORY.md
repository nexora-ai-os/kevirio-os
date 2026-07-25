# Environment Variable Inventory

値は記録していない。`.env.local`はGit非追跡。

| Variable | Reference | Boundary | Config present locally | Status/Risk |
|---|---|---|---|---|
| `VITE_SUPABASE_URL` | supabaseBrowserClient | Client/public | yes | required for Review login |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | same | Client/public | yes | publishable key only |
| `SUPABASE_URL` | supabaseServerClient | Server | yes | required live sandbox |
| `SUPABASE_SECRET_KEY` | same | Server restricted | yes | client source identifier absent |
| `OPENAI_API_KEY` | api/ai | Server restricted | yes | live sandbox only |
| `KEVIRIO_ALLOWED_ORIGIN` | verifiedOwnerContext | Server | yes | exact Origin required |
| `KEVIRIO_OPENAI_SANDBOX_ENABLED` | api/ai | Server | yes | exact `true` feature lock |
| `BASIC_AUTH_USER/PASSWORD` | middleware.js | Server | local file unknown | deployment boundary |
| `ANTHROPIC_API_KEY` | architecture docs only | none | yes | unused |
| `PERPLEXITY_API_KEY` | architecture docs only | none | yes | unused |
| `GEMINI_API_KEY` | no runtime ref | none | yes | unused |
| `CANVA_CLIENT_ID/SECRET` | no runtime ref | none | yes | unused |

Google/GitHub/Vercel runtime credential variablesは未実装。`.env.example`は存在せず、環境契約の再現性がない。Viteは起動時envを保持するため変更後はdev server restart/build/redeployが必要。
