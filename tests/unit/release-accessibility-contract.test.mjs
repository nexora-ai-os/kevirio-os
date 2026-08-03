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
const productionCss = read("../../src/components/ProductionScreens.css");
const tokens = read("../../src/design-system/tokens.css");
const headers = read("../../src/design-system/components/Headers.jsx");
const employeeCard = read("../../src/design-system/components/AIEmployeeCard.jsx");
const approvalCard = read("../../src/design-system/components/ApprovalCard.jsx");
const providerCard = read("../../src/design-system/components/ProviderCard.jsx");

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
    assert.match(screens[name], /EmptyState|LockedState|UnavailableState|DataReadiness|empty-copy/, `${name} requires an empty or truthful unavailable state`);
  }
  for (const name of ["Home", "Approvals", "Revenue", "Insights", "Integrations", "Audit"]) {
    assert.match(screens[name], /Skeleton|LoadingState|loading/i, `${name} requires loading semantics`);
  }
});

test("Production shell exposes accessible mobile navigation and Owner menu", () => {
  const sidebar = read("../../src/components/Sidebar.jsx");
  const topbar = read("../../src/components/TopBar.jsx");
  const auth = read("../../src/components/SupabaseOwnerAuthGate.jsx");
  assert.match(topbar, /aria-expanded=\{mobileOpen\}/);
  assert.match(topbar, /aria-label="Ownerメニュー"/);
  assert.match(sidebar, /sidebar--open/);
  assert.match(sidebar, /ナビゲーションを閉じる/);
  assert.doesNotMatch(auth, /Owner session verified/);
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

test("Final Closure width, typography and hero hierarchy contracts are token controlled", () => {
  for (const token of ["--content-standard:1440px", "--content-wide:1760px", "--text-body-md-size:1rem", "--text-body-sm-size:.875rem"]) assert.ok(tokens.includes(token), token);
  assert.match(headers, /variant = "standard"/);
  for (const variant of ["large", "medium", "standard", "compact"]) assert.ok(componentCss.includes("kv-page-hero--" + variant), variant);
  for (const archetype of ["kv-home-screen", "kv-archetype-workforce", "offer-operations", "production-revenue", "kv-archetype-directory", "kv-archetype-audit"]) assert.ok(productionCss.includes(archetype), archetype);
});

test("Sidebar cannot create horizontal overflow and Drawer restores focus", () => {
  assert.match(shellCss, /\.sidebar\{overflow:hidden\}/);
  assert.match(shellCss, /\.nav\{[^}]*overflow-x:hidden/);
  assert.match(shellCss, /\.nav button span\{[^}]*text-overflow:ellipsis/);
  assert.match(shell, /querySelector\("\.kv-sidebar-close"\)\?\.focus/);
  assert.match(shell, /querySelector\("\.kv-mobile-menu"\)\?\.focus/);
});

test("Japanese-first cards keep technical details secondary and do not expose fake controls", () => {
  for (const copy of ["現在の仕事", "最終活動", "権限と実行境界"]) assert.ok(employeeCard.includes(copy), copy);
  for (const copy of ["金額・上限", "判断の効果", "対象と実行能力"]) assert.ok(approvalCard.includes(copy), copy);
  for (const copy of ["現在の利用可否", "接続状態", "次に行うこと", "接続契約の詳細"]) assert.ok(providerCard.includes(copy), copy);
  assert.doesNotMatch(providerCard, />Manage<|★★★★★|providerPriority|priorityRank/i);
});

test("Locked Inbox provides the existing Approvals route and Settings policies are Japanese-first", () => {
  assert.match(screens.Inbox, /actionLabel="承認画面を確認"/);
  assert.match(screens.Inbox, /setPage\?\.\("approval"\)/);
  for (const title of ["表示テーマ", "実行ポリシー", "Provider認証情報", "ワークスペース"]) assert.ok(screens.Settings.includes(title), title);
  assert.doesNotMatch(screens.Settings, /<input|<button|onClick=/);
});

test("Operations exposes lifecycle without changing repository commands", () => {
  assert.match(screens.Operations, /kv-operation-lifecycle/);
  for (const stage of ["Offer", "Intelligence", "Strategy", "Content", "Approval", "Evidence", "Revenue", "Learning"]) assert.ok(screens.Operations.includes('"' + stage + '"'), stage);
  assert.match(productionCss, /\.kv-operation-lifecycle/);
});
