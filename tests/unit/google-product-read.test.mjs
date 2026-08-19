import test from "node:test";
import assert from "node:assert/strict";
import { createOAuthCipher } from "../../server/oauthRuntime.js";
import { readGoogleProductData } from "../../server/googleProductRead.js";

const key = "test-only-key-that-is-at-least-thirty-two-bytes";
const scopes = ["https://www.googleapis.com/auth/gmail.readonly", "https://www.googleapis.com/auth/calendar.readonly", "https://www.googleapis.com/auth/drive.metadata.readonly"];
const cipher = createOAuthCipher(key);
const client = { from: () => ({ select() { return this; }, eq() { return this; }, maybeSingle: async () => ({ data: { state: "connected", token_ciphertext: cipher.encrypt("token"), refresh_token_ciphertext: cipher.encrypt("refresh"), token_expires_at: new Date(Date.now() + 3_600_000).toISOString(), granted_scopes: scopes }, error: null }) }) };

test("Google product read is bounded and excludes bodies and file content", async () => {
  const calls = [];
  const transport = async (url) => {
    calls.push(url);
    if (url.includes("/messages?")) return { ok: true, json: async () => ({ messages: [{ id: "m1" }] }) };
    if (url.includes("/messages/m1")) return { ok: true, json: async () => ({ id: "m1", internalDate: "0", payload: { headers: [{ name: "From", value: "sender" }, { name: "Subject", value: "subject" }] } }) };
    if (url.includes("calendar")) return { ok: true, json: async () => ({ items: [{ id: "e1", summary: "event", start: { date: "2026-08-19" }, end: { date: "2026-08-20" } }] }) };
    return { ok: true, json: async () => ({ files: [{ id: "f1", name: "file", mimeType: "text/plain", modifiedTime: "2026-08-19T00:00:00Z" }] }) };
  };
  const result = await readGoogleProductData({ client, workspaceId: "w", encryptionKey: key, query: "file", transport });
  assert.equal(result.ok, true);
  assert.equal(result.gmail.length, 1);
  assert.equal(result.calendar.length, 1);
  assert.equal(result.drive.length, 1);
  assert.equal(result.bodyFetched, false);
  assert.equal(result.fileContentFetched, false);
  assert.equal(result.attachmentsFetched, false);
  assert.ok(calls.every((url) => !url.includes("attachments")));
  assert.ok(calls.some((url) => url.includes("pageSize=5")));
});
