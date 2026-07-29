# Vercel Environment Matrix

値は記載しない。

| Name | Development | Preview | Production | Boundary |
|---|---|---|---|---|
| SUPABASE_URL | required | required | required | server |
| SUPABASE_SECRET_KEY | required | required | required | server-only |
| OAUTH_TOKEN_ENCRYPTION_KEY | required for OAuth | required for OAuth | required for OAuth | server-only |
| OAUTH_REDIRECT_BASE_URL | required | required | required | server |
| GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET | OAuth only | OAuth only | OAuth only | secret server-only |
| CANVA_CLIENT_ID / CANVA_CLIENT_SECRET | OAuth only | OAuth only | OAuth only | secret server-only |
| Provider API keys | runtime only | runtime only | runtime only | server-only |
| EXTERNAL_EXECUTION_ENABLED | false | false | false | server |
| Provider execution switches | false | false | false | server |
| Google capability switches | false | false | false | server |
| Analytics property / Search Console site / YouTube channel | optional until binding | required for service | required for service | server metadata |

`VITE_` prefixをSecretへ付けてはならない。
