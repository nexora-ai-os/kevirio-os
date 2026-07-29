import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const app = read("../../src/App.jsx");
const home = read("../../src/components/CanonicalHome.jsx");
const employees = read("../../src/components/GoogleOperationsEmployee.jsx");
const approvals = read("../../src/components/CanonicalApprovals.jsx");
const operations = read("../../src/components/OfferOperationsWorkspace.jsx");
const index = read("../../src/design-system/index.js");

test("four approved Production screens are route-level lazy modules", () => {
  for (const screen of ["CanonicalHome", "GoogleOperationsEmployee", "CanonicalApprovals", "OfferOperationsWorkspace"]) assert.match(app, new RegExp(`lazy\\(\\(\\) => import\\(\\"\\./components/${screen}\\.jsx\\"\\)\\)`));
  assert.match(app, /production: <ProductionRevenueWorkspace/);
});

test("screen-specific components are public and unused components remain deferred", () => {
  for (const component of ["KpiCard", "AIEmployeeCard", "ApprovalCard", "Table", "ProviderCard", "Timeline"]) assert.match(index, new RegExp(`\\b${component}\\b`));
  for (const deferred of ["Drawer", "Toast"]) assert.doesNotMatch(index, new RegExp(`\\b${deferred}\\b`));
});

test("Home keeps canonical repositories and truth boundaries", () => {
  assert.match(home, /createRevenueRepository/);
  assert.match(home, /createOfferOperationsRepository/);
  assert.match(home, /buildCanonicalRevenueOverview/);
  assert.match(home, /kind="actual" evidenceVerified/);
  assert.doesNotMatch(home, /localStorage|mockEventLedger/);
});

test("AI Employees remains registry-backed and Google Dry Run locked", () => {
  assert.match(employees, /GOOGLE_CAPABILITIES/);
  assert.match(employees, /GOOGLE_WORKFLOWS/);
  assert.match(employees, /environment="dry_run"/);
  assert.match(employees, /Google API calls: 0/);
  assert.doesNotMatch(employees, /fetch\(|rpc\(|\.from\(/);
});

test("Approvals use exact snapshot and existing repository command", () => {
  assert.match(approvals, /repository\.decideApproval\(approval\.id, decision/);
  for (const decision of ["approve", "revise", "reject"]) assert.match(approvals, new RegExp(`decide\\(item, "${decision}"`));
  assert.doesNotMatch(approvals, /decide\(item, "hold"/);
  assert.match(approvals, /approval\.preview_snapshot/);
  assert.match(approvals, /No bulk approval/);
  assert.match(approvals, /Approval alone does not execute externally/);
  assert.doesNotMatch(approvals, /optimistic|localStorage/i);
});

test("Operations preserves existing command callbacks and external lock", () => {
  for (const command of ["registerOffer", "prepareOperation", "decideApproval", "recordPackageAccess", "recordPerformance", "recordCost", "generateLearning"]) assert.match(operations, new RegExp(`repository\\.${command}`));
  assert.match(operations, /External execution: LOCKED/);
  assert.match(operations, /<Money value=\{v\.netProfitMinor\}[^>]+kind="actual" evidenceVerified/);
});

test("all four screens integrate canonical PageHeader", () => {
  for (const source of [home, employees, approvals, operations]) assert.match(source, /<PageHeader/);
});
