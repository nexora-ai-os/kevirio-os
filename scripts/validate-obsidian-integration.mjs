import assert from "node:assert/strict";
import { mkdir, readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { resolveVaultPath, vaultFile, START, END } from "../tools/obsidian/config.mjs";
import { atomicWriteIfChanged, updateManagedNote } from "../tools/obsidian/core.mjs";

const vault = await resolveVaultPath();
const managedNote = vaultFile(vault, "11_HANDOVER/CURRENT_HANDOVER.md");
const existing = await readFile(managedNote, "utf8");
assert.ok(existing.includes(START) && existing.includes(END), "Existing managed handover block not found");

const probeDirectory = vaultFile(vault, "99_INTEGRATION_TESTS");
const probe = path.join(probeDirectory, "CODEX_MANAGED_BLOCK_PROBE.md");
const ownerBefore = "Owner text before — preserve exactly.";
const ownerAfter = "Owner text after — preserve exactly.";
await mkdir(probeDirectory, { recursive: true });
await atomicWriteIfChanged(probe, `${ownerBefore}\n\n${START}\ninitial\n${END}\n\n${ownerAfter}\n`);
await updateManagedNote(vault, "99_INTEGRATION_TESTS/CODEX_MANAGED_BLOCK_PROBE.md", `Integration status: VERIFIED\nMarker: ${new Date().toISOString()}\nSensitive data: NONE`);
const updated = await readFile(probe, "utf8");
assert.ok(updated.includes("Integration status: VERIFIED"), "Managed write read-back failed");
assert.ok(updated.startsWith(ownerBefore) && updated.trimEnd().endsWith(ownerAfter), "Owner-authored content changed");
assert.equal((updated.match(new RegExp(START.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length, 1, "Managed block start is ambiguous");
assert.equal((updated.match(new RegExp(END.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length, 1, "Managed block end is ambiguous");
await unlink(probe);

console.log(JSON.stringify({ classification: "OBSIDIAN_FULLY_CONNECTED", vaultResolved: true, existingManagedRead: true, disposableManagedWrite: true, readBack: true, ownerContentPreserved: true, probeRemoved: true, productionMutation: 0, paidCalls: 0 }, null, 2));
