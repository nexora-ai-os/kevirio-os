import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const screens = Object.freeze({
  Home: read("../../src/components/CanonicalHome.jsx"),
  "AI Employees": read("../../src/components/GoogleOperationsEmployee.jsx"),
  Approvals: read("../../src/components/CanonicalApprovals.jsx"),
  Operations: read("../../src/components/OfferOperationsWorkspace.jsx"),
  Revenue: read("../../src/components/ProductionRevenueWorkspace.jsx"),
  Insights: read("../../src/components/Analytics.jsx"),
  Integrations: read("../../src/components/ProviderHub.jsx"),
  Inbox: read("../../src/components/CanonicalInbox.jsx"),
  Audit: read("../../src/components/CanonicalAudit.jsx"),
  Settings: read("../../src/components/CanonicalSettings.jsx"),
});
const shell = read("../../src/app/shell/ApplicationShell.jsx");
const shellCss = read("../../src/app/shell/shell.css");
const componentCss = read("../../src/design-system/components.css");
const baseCss = read("../../src/design-system/base.css");
const table = read("../../src/design-system/components/Table.jsx");
const button = read("../../src/design-system/components/Button.jsx");

test("every Production screen exposes a main landmark and canonical page heading", () => {
  for (const [name, source] of Object.entries(screens)) {
    assert.match(source, /<main\b/, `${name} requires a main landmark`);
    assert.match(source, /<PageHeader\b/, `${name} requires PageHeader`);
  }
});

test("every Production screen has a truthful non-success state where applicable", () => {
  for (const name of ["Home", "Approvals", "Operations", "Revenue", "Insights", "Integrations", "Audit"]) {
    assert.match(screens[name], /ErrorState|error/i, `${name} requires an error state`);
  }
  for (const name of ["Home", "Approvals", "Revenue", "Insights", "Integrations", "Inbox", "Audit", "Settings"]) {
    assert.match(screens[name], /EmptyState|empty-copy/, `${name} requires an empty or truthful unavailable state`);
  }
  for (const name of ["Home", "Approvals", "Revenue", "Insights", "Integrations", "Audit"]) {
    assert.match(screens[name], /Skeleton|LoadingState|loading/i, `${name} requires loading semantics`);
  }
});

test("shell keyboard and focus order use native document order", () => {
  assert.match(shell, /href="#main-content"/);
  assert.match(shell, /id="main-content"/);
  assert.match(shell, /tabIndex=\{-1\}/);
  assert.match(shellCss, /\.kv-skip-link:focus/);
  assert.match(baseCss, /:focus-visible/);
  assert.doesNotMatch(shell, /tabIndex=\{[1-9]/);
});

test("shared controls expose disabled reasons and busy state", () => {
  assert.match(button, /aria-busy=\{loading \|\| undefined\}/);
  assert.match(button, /aria-describedby=\{isDisabled && disabledReason \? reasonId/);
  assert.match(button, /disabledReason/);
  assert.match(screens.Approvals, /aria-pressed/);
});

test("responsive table retains headers and accessible table semantics", () => {
  assert.match(table, /<table className="kv-table">/);
  assert.match(table, /<caption/);
  assert.match(table, /scope="col"/);
  assert.match(table, /data-label=/);
  assert.match(componentCss, /@media \(max-width: 767px\)/);
});

test("reduced motion is globally respected", () => {
  assert.match(baseCss, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(baseCss, /animation-duration: 0\.01ms/);
  assert.match(baseCss, /scroll-behavior: auto/);
});
