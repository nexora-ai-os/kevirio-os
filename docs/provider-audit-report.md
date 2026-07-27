# KEVIRIO Production Provider Audit

Generated: 2026-07-27T19:30:27.332Z

> Secret values are never included. External Execution remains LOCKED.

| Provider | Local config | Vercel Dev / Preview / Prod | Code | Credential | OAuth | Billing | Connection | Maturity | Blocker |
|---|---|---|---|---|---|---|---|---|---|
| openai | OPENAI_API_KEY, KEVIRIO_OPENAI_SANDBOX_ENABLED | absent / absent / absent | implemented | valid | not_applicable | not_determined | connected | Conditional | none |
| anthropic | ANTHROPIC_API_KEY | absent / absent / absent | not_implemented | valid | not_applicable | not_determined | connected | Locked | Credential is valid, but no governed runtime adapter exists. |
| perplexity | PERPLEXITY_API_KEY | absent / absent / absent | not_implemented | valid | not_applicable | not_determined | request_rejected | Locked | request_rejected |
| gemini | GEMINI_API_KEY | absent / absent / absent | not_implemented | present_but_permission_denied | not_applicable | not_determined | authentication_failed | Locked | authentication_failed |
| canva | CANVA_CLIENT_ID, CANVA_CLIENT_SECRET | absent / absent / absent | not_implemented | client_credentials_only | incomplete | not_applicable | oauth_access_token_missing | Locked | OAuth callback and token lifecycle are not implemented. |
| google | none | absent / absent / absent | not_implemented | unknown | incomplete | not_applicable | oauth_not_authorized | Locked | OAuth callback and token lifecycle are not implemented. |
| supabase | VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, SUPABASE_SECRET_KEY | absent / absent / absent | implemented | valid | not_applicable | not_determined | connected | Production | none |
| github | none | absent / absent / absent | repository_only | not_applicable | not_applicable | unknown | cli_or_metadata_only | Conditional | Git remote is configured; GitHub CLI is unavailable and no push was attempted. |
| vercel | none | absent / absent / absent | project_only | not_applicable | not_applicable | unknown | cli_or_metadata_only | Conditional | Repository is not locally linked; environment names were empty in audited project. |
