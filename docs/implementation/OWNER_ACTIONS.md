# Owner Actions

See final report for full UI instructions. Required external actions:

1. Confirm migration 003 is present, then apply additive migration 004.
2. Sign in to KEVIRIO as the active Owner and click `Owner Workspaceを初期化` once.
3. Configure Preview/Production environment variables without placing server secrets in `VITE_*`.
4. Redeploy and run login/cross-workspace/critical-path smoke verification.
5. Keep all external execution feature flags disabled.

Never share secret values, tokens, cookies, sessions or customer data.
