import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("audit resolves the server-derived Personal Workspace without assuming one membership", async () => {
  const source = await readFile(new URL("../../src/components/CanonicalAudit.jsx", import.meta.url), "utf8");
  assert.match(source, /rpc\("resolve_personal_workspace"\)/);
  assert.doesNotMatch(source, /from\("workspace_members"\)/);
  assert.match(source, /\.eq\("workspace_id", workspace\.data\)/);
  assert.doesNotMatch(source, /insert\(|update\(|delete\(/);
});
