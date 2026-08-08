import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { NAVIGATION_ITEMS, NAVIGATION_SECTIONS, isNavigationItemActive, isNavigationItemVisible, navigationContext, resolveNavigationRoute } from "../../src/app/navigation.js";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const shell = read("../../src/app/shell/ApplicationShell.jsx");
const sidebar = read("../../src/components/Sidebar.jsx");
const topbar = read("../../src/components/TopBar.jsx");
const breadcrumbs = read("../../src/app/shell/Breadcrumbs.jsx");
const routes = read("../../src/app/routes.js");
const app = read("../../src/App.jsx");

test("canonical navigation metadata is unique and future-ready", () => {
  assert.deepEqual(NAVIGATION_SECTIONS, ["COMPANY", "BUSINESS", "CONTROL"]);
  assert.equal(new Set(NAVIGATION_ITEMS.map((item) => item.id)).size, NAVIGATION_ITEMS.length);
  const directRoutes = NAVIGATION_ITEMS.map((item) => item.route).filter(Boolean);
  assert.equal(new Set(directRoutes).size, directRoutes.length);
  for (const item of NAVIGATION_ITEMS) for (const key of ["id", "label", "icon", "section", "visibility", "exact", "badgeSlot", "permission"]) assert.ok(key in item, `${item.id}.${key}`);
});

test("active state handles exact, nested, and contextual Affiliate routes", () => {
  const item = (id) => NAVIGATION_ITEMS.find((entry) => entry.id === id);
  assert.equal(isNavigationItemActive(item("home"), "/home"), true);
  assert.equal(isNavigationItemActive(item("home"), "/home/other"), false);
  assert.equal(isNavigationItemActive(item("production"), "/revenue/actual"), true);
  assert.equal(isNavigationItemActive(item("companyCore"), "/company-core/businesses/b1"), true);
  assert.equal(isNavigationItemActive(item("affiliate"), "/affiliate-intelligence/p1/strategy"), true);
  assert.equal(isNavigationItemActive(item("affiliate"), "/affiliate-intelligence/p1/revenue"), false);
  assert.equal(isNavigationItemActive(item("revenueWorkspace"), "/affiliate-intelligence/p1/revenue"), true);
  assert.equal(resolveNavigationRoute(item("publicationWorkspace"), "/affiliate-intelligence/p1/strategy"), "/affiliate-intelligence/p1/publication");
  assert.equal(isNavigationItemVisible(item("publicationWorkspace"), "/home"), false);
});

test("breadcrumbs derive hierarchy and keep current page non-clickable", () => {
  assert.deepEqual(navigationContext("/home").crumbs.map((item) => item.label), ["ホーム"]);
  assert.deepEqual(navigationContext("/company-core").crumbs.map((item) => item.label), ["Business", "Company Core"]);
  const nested = navigationContext("/affiliate-intelligence/p1/revenue").crumbs;
  assert.deepEqual(nested.map((item) => item.label), ["Business", "Affiliate Intelligence", "Revenue Workspace"]);
  assert.equal(nested.at(-1).route, null);
  assert.match(breadcrumbs, /aria-label="パンくずリスト"/);
  assert.match(breadcrumbs, /!crumb\.current/);
});

test("shell owns collapse persistence, Ctrl+B, drawer containment, and focus restoration", () => {
  assert.match(shell, /kevirio\.sidebar\.collapsed/);
  assert.match(shell, /window\.localStorage\.setItem/);
  assert.match(shell, /event\.key\.toLowerCase\(\)==="b"/);
  assert.match(shell, /editableTarget\(event\.target\)/);
  assert.match(shell, /event\.repeat/);
  assert.match(shell, /document\.body\.style\.overflow="hidden"/);
  assert.match(shell, /event\.key==="Escape"/);
  assert.match(shell, /event\.key!=="Tab"/);
  assert.match(shell, /querySelector\("\.kv-mobile-menu"\)\?\.focus/);
  assert.match(sidebar, /onMobileClose\?\.\(\)/);
});

test("one shared Sidebar and Header consume the canonical route context", () => {
  assert.match(sidebar, /NAVIGATION_ITEMS/);
  assert.match(sidebar, /useLocation/);
  assert.match(sidebar, /useNavigate/);
  assert.match(topbar, /navigationContext/);
  assert.match(app, /sidebar=\{<Sidebar \/>\}/);
  assert.equal((app.match(/<TopBar/g) || []).length, 1);
  assert.match(routes, /\/affiliate-intelligence\/:programId\/:view/);
});
