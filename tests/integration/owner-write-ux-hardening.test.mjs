import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8");

test("shared owner write state is explicit and blocks accidental unload", async () => {
  const source = await read("src/app/ownerEditGuard.jsx");
  for (const state of ["SAVED", "UNSAVED", "SAVING", "SAVE_FAILED", "CONFLICT"]) assert.match(source, new RegExp(state));
  assert.match(source, /beforeunload/);
  assert.match(source, /confirmNavigation/);
  assert.match(source, /event\.returnValue = ""/);
});

test("canonical and Affiliate editors report to the shared write boundary", async () => {
  const [canonical, affiliate, sidebar] = await Promise.all([
    read("src/components/next/CanonicalDomainWorkspace.jsx"),
    read("src/components/affiliate-v2/AffiliateProgramMaster.jsx"),
    read("src/components/Sidebar.jsx"),
  ]);
  assert.match(canonical, /useOwnerEditGuard/);
  assert.match(canonical, /入力内容は保持されています/);
  assert.match(affiliate, /useOwnerEditGuard/);
  assert.match(affiliate, /OWNER_SAVE_STATE\.CONFLICT/);
  assert.match(sidebar, /confirmNavigation/);
});

test("operational guide stores only a navigation pointer and derives Affiliate work state", async () => {
  const [guide, affiliate] = await Promise.all([
    read("src/components/OperationalGuideLayer.jsx"),
    read("src/components/affiliate-v2/AffiliateProgramMaster.jsx"),
  ]);
  for (const label of ["ACTIVE WORK", "CURRENT STATE", "WORKFLOW PROGRESS", "NEXT RECOMMENDED ACTION", "BLOCKER / MISSING", "SAVE STATE"]) assert.match(guide, new RegExp(label));
  assert.match(guide, /const pointer = \{ path: .* label: .* at:/);
  assert.doesNotMatch(guide, /localStorage\.setItem\([^\n]+(?:payload|secret|access_token)/);
  assert.match(affiliate, /kevirio:active-work/);
});
