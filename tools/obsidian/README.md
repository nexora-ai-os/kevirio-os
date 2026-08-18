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

## VS Code Codex usage

Codex should resolve the vault through `resolveVaultPath`, read managed handover/knowledge at the start of a major phase when durable context is needed, and update only canonical managed blocks for phase handovers, incidents, or durable learnings. Text outside `<!-- KEVIRIO:AUTO:START -->` and `<!-- KEVIRIO:AUTO:END -->` is Owner-controlled and must not be rewritten. Supabase remains the operational Source of Truth; Obsidian stores distilled knowledge only. Never store credentials, raw personal records, private conversations, full drafts, or third-party PII. Do not write routine test logs or minor UI edits.

Validate access and preservation with `node --env-file-if-exists=.env.local scripts/validate-obsidian-integration.mjs`.
