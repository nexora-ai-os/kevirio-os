import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const files = readdirSync(new URL(".", import.meta.url))
  .filter((name) => name.startsWith("verify-") && name.endsWith(".mjs"))
  .filter((name) => name !== "verify-production-foundation-migration.mjs")
  .sort();
const failures = [];
for (const file of files) {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL(file, import.meta.url))], { stdio: "inherit" });
  if (result.status !== 0) failures.push(file);
}
console.log(`Legacy verification scripts: ${files.length - failures.length}/${files.length} passed`);
if (failures.length) process.exit(1);
