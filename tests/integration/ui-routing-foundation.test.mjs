import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { APP_ROUTES, LEGACY_REDIRECTS, pathForPage } from "../../src/app/routes.js";

const router = readFileSync(new URL("../../src/app/router.jsx", import.meta.url), "utf8");
const main = readFileSync(new URL("../../src/main.jsx", import.meta.url), "utf8");
const app = readFileSync(new URL("../../src/App.jsx", import.meta.url), "utf8");

test("canonical UI route contract is registered", () => {
  const paths = new Set(APP_ROUTES.map(({ path }) => path));
  for (const path of [
    "/home", "/employees", "/employees/:employeeId", "/employees/:employeeId/tasks/:taskId",
    "/approvals", "/approvals/:approvalId", "/operations", "/operations/offers",
    "/operations/workflows", "/operations/:operationId", "/revenue", "/revenue/actual",
    "/revenue/forecast", "/revenue/evidence", "/revenue/campaigns", "/revenue/records/:recordId",
    "/insights", "/integrations", "/integrations/:providerId", "/settings", "/inbox", "/audit",
  ]) assert.equal(paths.has(path), true, `${path} must be registered`);
});

test("legacy Labs routes are no longer part of the Production route registry", () => {
  assert.equal(APP_ROUTES.some(({ path }) => path.startsWith("/labs")), false);
  assert.match(router, /path="\/labs\/components"/);
});

test("root, legacy paths and unknown routes have deterministic handling", () => {
  assert.match(router, /<Navigate to="\/home" replace/);
  assert.match(router, /path="\*" element=\{<MessageRoute title="404 Not Found"/);
  assert.equal(LEGACY_REDIRECTS.some(({ from, to }) => from === "/production" && to === "/revenue"), true);
});

test("existing page navigation updates browser history through the route adapter", () => {
  assert.equal(pathForPage("approval"), "/approvals");
  assert.equal(pathForPage("production"), "/revenue");
  assert.equal(pathForPage("unknown"), "/home");
  assert.match(app, /onPageChange\?\.\(nextPage\)/);
  assert.match(router, /useNavigate/);
});

test("auth remains outside the router and the legacy app is lazy loaded", () => {
  assert.match(main, /<SupabaseOwnerAuthGate><AppRouter \/><\/SupabaseOwnerAuthGate>/);
  assert.match(router, /lazy\(\(\) => import\("\.\.\/App\.jsx"\)\)/);
  assert.doesNotMatch(main, /import App from/);
});
