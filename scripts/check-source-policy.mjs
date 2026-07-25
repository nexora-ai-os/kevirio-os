import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split(/\r?\n/)
  .filter((file) => /\.(?:js|jsx|mjs|sql)$/.test(file));
const failures = [];
for (const file of tracked) {
  const source = readFileSync(file, "utf8");
  if (file.startsWith("src/") && /\b(?:SUPABASE_SECRET_KEY|OPENAI_API_KEY)\b/.test(source)) failures.push(`${file}: server credential identifier in client source`);
  if (file.startsWith("src/") && /localStorage\.(?:setItem|getItem)\([^)]*(?:token|secret|password|credential)/i.test(source)) failures.push(`${file}: credential-like localStorage access`);
  if (/console\.(?:log|error|warn)\([^)]*(?:access_token|refresh_token|authorization|password)/i.test(source)) failures.push(`${file}: sensitive logging pattern`);
}
if (failures.length) {
  failures.forEach((failure) => console.error(`POLICY_FAIL ${failure}`));
  process.exit(1);
}
console.log(`Source policy check: ${tracked.length} files passed`);
