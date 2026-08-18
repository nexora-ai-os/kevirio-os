import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { AUTH_FILE } from "./support.mjs";
import { provisionLocalPlaywrightOwner } from "./local-supabase-fixture.mjs";

export default async function globalSetup() {
  const fixture = await provisionLocalPlaywrightOwner();
  assert.match(fixture.url, /^http:\/\/127\.0\.0\.1:/, "Browser fixture must remain local");
  const state = {
    cookies: [],
    origins: [{ origin: "http://127.0.0.1:5173", localStorage: [{ name: fixture.storageKey, value: JSON.stringify(fixture.session) }] }],
  };
  await mkdir("playwright/.auth", { recursive: true });
  await writeFile(AUTH_FILE, JSON.stringify(state), { encoding: "utf8" });
  process.env.KEVIRIO_PLAYWRIGHT_USER_ID = fixture.userId;
}
