import { readdirSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, relative } from "node:path";

const roots = ["src", "server", "api", "scripts", "tests"];
const files = [];
function walk(path) {
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const next = join(path, entry.name);
    if (entry.isDirectory()) walk(next);
    else if (/\.(mjs|js)$/.test(entry.name)) files.push(next);
  }
}
for (const root of roots) {
  try { if (statSync(root).isDirectory()) walk(root); } catch {}
}
const failures = [];
for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status !== 0) failures.push({ file: relative(".", file), error: result.stderr.trim() });
}
if (failures.length) {
  failures.forEach((failure) => console.error(`SYNTAX_FAIL ${failure.file}\n${failure.error}`));
  process.exit(1);
}
console.log(`JavaScript syntax check: ${files.length}/${files.length} passed`);
