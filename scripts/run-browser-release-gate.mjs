import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const groups = [
  { name: "AUTH_ONBOARDING", files: ["tests/browser/auth.setup.mjs"], project: "auth", budgetMs: 180_000 },
  { name: "TEAM_LIFECYCLE", files: ["tests/browser/phase5-member-lifecycle.spec.mjs"], project: "chromium", budgetMs: 240_000 },
  { name: "CONTENT_OPPORTUNITY_HOME_AI", files: ["tests/browser/next-phase1.spec.mjs"], project: "chromium", budgetMs: 300_000 },
  { name: "REVENUE_LEARNING", files: ["tests/browser/phase4-loop.spec.mjs"], project: "chromium", budgetMs: 240_000 },
  { name: "DATA_TRUTH", files: ["tests/browser/data-truth.spec.mjs"], project: "chromium", budgetMs: 300_000 },
  { name: "NAVIGATION_ROUTES", files: ["tests/browser/routes.spec.mjs", "tests/browser/motion.spec.mjs"], project: "chromium", budgetMs: 300_000 },
  { name: "ACCESSIBILITY_BASE", files: ["tests/browser/accessibility.spec.mjs"], project: "chromium", budgetMs: 360_000 },
  { name: "ACCESSIBILITY_PHASE6", files: ["tests/browser/phase6-accessibility.spec.mjs"], project: "chromium", budgetMs: 300_000 },
  ...["desktop", "laptop", "ipad-landscape", "ipad-portrait", "mobile", "small-mobile"].map((viewport) => ({
    name: `RESPONSIVE_${viewport.toUpperCase().replaceAll("-", "_")}`,
    files: ["tests/browser/responsive.spec.mjs"], project: "chromium", budgetMs: 240_000,
    extraArgs: ["--grep", `^${viewport} `],
  })),
  { name: "MOBILE_PHASE6", files: ["tests/browser/phase6-mobile.spec.mjs"], project: "chromium", budgetMs: 300_000 },
];

const artifactDirectory = "playwright-artifacts/release";
mkdirSync(artifactDirectory, { recursive: true });
const requested = process.argv.slice(2);
const aggregateOnly = requested.includes("--aggregate-only");
const selected = requested.filter((value) => value !== "--aggregate-only");
const active = selected.length ? groups.filter(({ name }) => selected.includes(name)) : groups;

if (!aggregateOnly) {
  for (const group of active) {
    const output = resolve(`${artifactDirectory}/${group.name}.json`);
    if (existsSync(output)) unlinkSync(output);
    const started = Date.now();
    process.stdout.write(`[${group.name}] START ${new Date().toISOString()}\n`);
    const run = spawnSync(process.execPath, [
      resolve("node_modules/@playwright/test/cli.js"), "test", ...group.files,
      `--project=${group.project}`, ...(group.extraArgs || []),
    ], {
      stdio: "inherit",
      env: { ...process.env, KEVIRIO_PLAYWRIGHT_RESULT: output, KEVIRIO_TEST_RUN_ID: `phase6-${Date.now()}-${group.name.toLowerCase()}` },
      timeout: group.budgetMs,
      windowsHide: true,
    });
    const execution = {
      exitCode: run.status,
      timedOut: run.error?.code === "ETIMEDOUT",
      spawnError: run.error?.code || null,
      durationMs: Date.now() - started,
    };
    writeFileSync(`${artifactDirectory}/${group.name}.execution.json`, JSON.stringify(execution, null, 2));
    process.stdout.write(`[${group.name}] END ${JSON.stringify(execution)}\n`);
  }
}

const aggregate = { startedAt: new Date().toISOString(), groups: [], tests: [] };
for (const group of groups) {
  const resultPath = `${artifactDirectory}/${group.name}.json`;
  const executionPath = `${artifactDirectory}/${group.name}.execution.json`;
  let tests = [];
  let execution = { exitCode: null, timedOut: false, spawnError: "evidence_missing", durationMs: null };
  try { tests = JSON.parse(readFileSync(resultPath, "utf8")).tests || []; } catch {}
  try { execution = JSON.parse(readFileSync(executionPath, "utf8")); } catch {}
  const statuses = tests.map((test) => test.status || "missing");
  const result = {
    ...group, ...execution, expected: tests.length,
    executed: statuses.filter((status) => status !== "missing").length,
    passed: statuses.filter((status) => status === "passed").length,
    failed: statuses.filter((status) => status === "failed").length,
    skipped: statuses.filter((status) => status === "skipped").length,
    interrupted: statuses.filter((status) => status === "interrupted").length,
    missing: statuses.filter((status) => status === "missing").length,
  };
  aggregate.groups.push(result);
  aggregate.tests.push(...tests.map((test, index) => ({ ...test, group: group.name, status: statuses[index] })));
}
aggregate.finishedAt = new Date().toISOString();
aggregate.summary = {
  expected: aggregate.tests.length,
  executed: aggregate.tests.filter((test) => test.status !== "missing").length,
  passed: aggregate.tests.filter((test) => test.status === "passed").length,
  failed: aggregate.tests.filter((test) => test.status === "failed").length,
  skipped: aggregate.tests.filter((test) => test.status === "skipped").length,
  interrupted: aggregate.tests.filter((test) => test.status === "interrupted").length,
  missing: aggregate.tests.filter((test) => test.status === "missing").length,
  timeouts: aggregate.groups.filter((group) => group.timedOut).length,
  evidenceMissing: aggregate.groups.filter((group) => group.spawnError === "evidence_missing").length,
  productFailures: aggregate.tests.filter((test) => test.status === "failed").length,
};
aggregate.ok = aggregate.groups.every((group) => group.exitCode === 0 && group.expected > 0 && group.passed === group.expected);
writeFileSync(`${artifactDirectory}/aggregate.json`, JSON.stringify(aggregate, null, 2));
console.log(JSON.stringify(aggregate.summary, null, 2));
process.exitCode = aggregate.ok ? 0 : 1;
