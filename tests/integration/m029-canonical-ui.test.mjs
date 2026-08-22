import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8");

test("M029 canonical UI routes writes through protected RPCs only", async () => {
  const repository = await read("src/repositories/canonicalDomainRepository.js");
  assert.match(repository, /rpc\("save_canonical_domain_object"/);
  assert.match(repository, /rpc\("save_personal_operational_record_v2"/);
  assert.match(repository, /rpc\("save_canonical_domain_draft"/);
  assert.match(repository, /rpc\("archive_canonical_domain_object"/);
  assert.doesNotMatch(repository, /\.insert\(|\.update\(|\.delete\(/);
});

test("canonical workspaces expose persistence search timeline and conflict UX", async () => {
  const [app, component] = await Promise.all([
    read("src/App.jsx"), read("src/components/next/CanonicalDomainWorkspace.jsx"),
  ]);
  for (const type of ["GOAL", "APPLICATION", "WORK", "CLIENT", "CONTENT", "KNOWLEDGE", "IMPROVEMENT"])
    assert.match(app, new RegExp(`type=\\"${type}\\"`));
  assert.match(component, /Canonical timeline/);
  assert.match(component, /type="search"/);
  assert.match(component, /別端末で更新されています/);
  assert.match(component, /External Execution LOCKED/);
  assert.match(component, /Paid AI ¥0/);
});
