import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const app = read("../../src/App.jsx");
const sidebar = read("../../src/components/Sidebar.jsx");
const revenue = read("../../src/components/ProductionRevenueWorkspace.jsx");
const insights = read("../../src/components/Analytics.jsx");
const integrations = read("../../src/components/ProviderHub.jsx");
const inbox = read("../../src/components/CanonicalInbox.jsx");
const audit = read("../../src/components/CanonicalAudit.jsx");
const settings = read("../../src/components/CanonicalSettings.jsx");

test("all ten Production destinations are route-level lazy modules", () => {
  for (const screen of ["CanonicalHome", "GoogleOperationsEmployee", "CanonicalApprovals", "OfferOperationsWorkspace", "ProductionRevenueWorkspace", "Analytics", "ProviderHub", "CanonicalInbox", "CanonicalAudit", "CanonicalSettings"]) {
    assert.match(app, new RegExp(`lazy\\(\\(\\) => import\\(\\"\\./components/${screen}\\.jsx\\"\\)\\)`));
  }
});

test("navigation is derived from the canonical three-section metadata", () => {
  const navigation = read("../../src/app/navigation.js");
  for (const section of ["COMPANY", "BUSINESS", "CONTROL"]) assert.match(navigation, new RegExp(`"${section}"`));
  for (const key of ["home", "googleOperations", "approval", "operations", "production", "analytics", "providerHub", "companyCore", "businessIntelligence", "affiliate", "inbox", "audit", "settings"]) assert.match(navigation, new RegExp(`id:\\"${key}\\"`));
  assert.match(sidebar, /NAVIGATION_ITEMS/);
  assert.doesNotMatch(sidebar, /const primaryItems|const utilityItems|Labs|Component Preview/);
});

test("Revenue and Insights preserve canonical repositories and Actual evidence semantics", () => {
  for (const source of [revenue, insights]) assert.match(source, /createRevenueRepository/);
  assert.match(insights, /createOfferOperationsRepository/);
  assert.match(revenue, /kind="actual" evidenceVerified/);
  assert.doesNotMatch(insights, /localStorage|mockEventLedger/);
});

test("Integrations is read-only and never selects credential values", () => {
  assert.match(integrations, /\.select\(/);
  assert.doesNotMatch(integrations, /\.insert\(|\.update\(|\.delete\(/);
  assert.doesNotMatch(integrations, /access_token|refresh_token|client_secret/);
  assert.match(integrations, /External Execution: LOCKED/);
});

test("Inbox and Settings are truthful non-mutating boundaries", () => {
  assert.match(inbox, /No canonical Production Inbox repository or data source exists/);
  assert.doesNotMatch(inbox, /create[A-Z].*Repository|supabase|\.from\(|fetch\(/i);
  assert.match(settings, /Not Implemented/);
  assert.doesNotMatch(settings, /input|button|onClick|\.from\(|fetch\(/i);
});

test("Audit is Owner-workspace scoped and redacts unsafe summaries", () => {
  assert.match(audit, /workspace_members/);
  assert.match(audit, /audit_logs/);
  assert.match(audit, /validateCredentialFreePayload/);
  assert.match(audit, /\[redacted\]/);
  assert.doesNotMatch(audit, /\.insert\(|\.update\(|\.delete\(/);
});
