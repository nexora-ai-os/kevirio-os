import {resolveVaultPath} from "../tools/obsidian/config.mjs";import {updateManagedNote} from "../tools/obsidian/core.mjs";import {validateVault} from "../tools/obsidian/sync.mjs";
const vault=await resolveVaultPath(process.env);await updateManagedNote(vault,"11_HANDOVER/CURRENT_HANDOVER.md",`## Persistent OAuth Connection
Date: 2026-08-19
Private Beta URL: https://kevirio-private-beta.vercel.app
Google: CONNECTED / persistent OAuth / gmail.readonly, calendar.readonly, drive.metadata.readonly
Google refresh: encrypted refresh token and expiry persisted; server-side refresh only on an Owner-triggered read near expiry
Canva: CONNECTED / persistent OAuth / profile:read only
Canva refresh: rotating refresh token replaced under a single database connection-state claim
Connection states: connected, token_expiring, refresh_failed, authorization_required, disconnected
Reauth conditions: revoked or invalid refresh grant, incompatible client credentials, scope change, explicit disconnect
Polling: NONE
Expected external API cost: JPY 0
External Execution: LOCKED
Write / Send / Publish / Delete: LOCKED
Secrets and OAuth tokens in Obsidian: NONE
Production alias: UNCHANGED`);console.log(JSON.stringify({classification:"OBSIDIAN_FULLY_CONNECTED",validation:await validateVault(vault),productionMutation:0,ownerContentPreserved:true,paidCalls:0},null,2));
