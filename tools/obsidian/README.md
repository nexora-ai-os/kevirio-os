# KEVIRIO Obsidian Automation

Deterministic local tooling. Repository/Codex may write managed Vault blocks; Supabase access is GET-only. The Vault never writes to the repository or Production. No paid AI provider is used.

## Commands

- `npm run obsidian:sync`
- `npm run obsidian:sync:revenue`
- `npm run obsidian:sync:affiliate`
- `npm run obsidian:sync:handover`
- `npm run obsidian:daily`
- `npm run obsidian:open`
- URI output: `node tools/obsidian/cli.mjs uri open KEVIRIO_HOME`, `uri daily`, or `uri search <query>`

Optional environment: `KEVIRIO_OBSIDIAN_VAULT_PATH`, `KEVIRIO_OBSIDIAN_WORKSPACE_ID`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_PUBLISHABLE_KEY`. Missing read configuration produces `UNKNOWN`.

Owner content outside managed blocks is preserved. The scheduler installer is preview-only and refuses installation without separate Owner approval.
