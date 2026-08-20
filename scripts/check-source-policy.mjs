import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const tracked = execFileSync("rg", ["--files"], { encoding: "utf8" })
  .split(/\r?\n/)
  .filter((file) => /\.(?:js|jsx|mjs|sql)$/.test(file));
const failures = [];
for (const file of tracked) {
  const normalized=file.replaceAll("\\","/");
  const source = readFileSync(file, "utf8");
  if (normalized.startsWith("src/") && /\b(?:SUPABASE_SECRET_KEY|OPENAI_API_KEY)\b/.test(source)) failures.push(`${normalized}: server credential identifier in client source`);
  if (normalized.startsWith("src/") && /localStorage\.(?:setItem|getItem)\([^)]*(?:token|secret|password|credential)/i.test(source)) failures.push(`${normalized}: credential-like localStorage access`);
  if (/console\.(?:log|error|warn)\([^)]*(?:access_token|refresh_token|authorization|password)/i.test(source)) failures.push(`${file}: sensitive logging pattern`);
  const providerNetwork=/api\.openai\.com|api\.anthropic\.com|api\.perplexity\.ai|generativelanguage\.googleapis\.com/i;
  const approvedNetwork=normalized==="server/openaiSandboxAdapter.js"||normalized==="server/geminiFreeAdapter.js"||normalized==="scripts/provider-health-check.mjs"||normalized==="scripts/gemini-quota-diagnostic.mjs"||normalized.startsWith("scripts/verify-")||normalized.startsWith("tests/");
  if(providerNetwork.test(source)&&!approvedNetwork)failures.push(`${normalized}: direct provider endpoint outside approved adapter or health check`);
  if(/from\s+["'](?:openai|@anthropic-ai\/sdk|@google\/genai)["']/.test(source)&&!normalized.startsWith("server/"))failures.push(`${normalized}: direct provider SDK import outside server adapter`);
  const adapterImport=/openaiSandboxAdapter/.test(source);const adapterImportAllowed=normalized==="server/openAIProviderGateway.js"||normalized==="scripts/check-source-policy.mjs"||normalized.startsWith("scripts/verify-")||normalized.startsWith("tests/");
  if(adapterImport&&!adapterImportAllowed&&normalized!=="server/openaiSandboxAdapter.js")failures.push(`${normalized}: provider adapter import bypasses provider gateway`);
}
if (failures.length) {
  failures.forEach((failure) => console.error(`POLICY_FAIL ${failure}`));
  process.exit(1);
}
console.log(`Source policy check: ${tracked.length} files passed`);
