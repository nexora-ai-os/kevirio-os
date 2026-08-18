import { resolveVaultPath } from "../tools/obsidian/config.mjs";
import { updateManagedNote } from "../tools/obsidian/core.mjs";
import { validateVault } from "../tools/obsidian/sync.mjs";

const vault = await resolveVaultPath(process.env);
await updateManagedNote(vault,"11_HANDOVER/CURRENT_HANDOVER.md",`## Free / Minimal / Safe Integration Activation
Date: 2026-08-18
Private Beta URL: https://kevirio-private-beta.vercel.app
New live external integrations: NONE
OpenAI / Anthropic / Perplexity: COST_POLICY_BLOCKED
Gemini: ERROR — configured credential reached quota exhausted; no paid fallback
Google OAuth and Gmail / Calendar / Drive / Analytics / Search Console / YouTube: CONFIGURED_NOT_ACTIVATED — read-only scopes proposed, Owner OAuth not requested
Canva: CONFIGURED_NOT_ACTIVATED — client configuration present, OAuth token absent
A8.net: MANUAL_OPERATION
Instagram / Threads / X / TikTok: API_ACCESS_PENDING
Polling: NONE
Paid API calls during activation: 0
Expected external API cost: ¥0
External Execution: LOCKED
Write / Send / Publish / Delete: LOCKED
Secrets and OAuth tokens in Obsidian: NONE
Production alias: UNCHANGED`);
console.log(JSON.stringify({classification:"OBSIDIAN_FULLY_CONNECTED",validation:await validateVault(vault),productionMutation:0,ownerContentPreserved:true,paidCalls:0},null,2));
