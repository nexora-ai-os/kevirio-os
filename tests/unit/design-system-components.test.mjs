import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolveMoneyDisplay } from "../../src/design-system/moneySemantics.js";
import { isDeveloperModeEnabled } from "../../src/app/developerMode.js";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const index = read("../../src/design-system/index.js");
const controls = read("../../src/design-system/components/FormControls.jsx");
const modal = read("../../src/design-system/components/Modal.jsx");
const ownerAction = read("../../src/design-system/components/OwnerActionItem.jsx");
const router = read("../../src/app/router.jsx");
const routes = read("../../src/app/routes.js");
const labs = read("../../src/labs/ComponentPreview.jsx");

test("Phase 3 components are exported through the public API", () => {
  for (const name of ["FormField", "Input", "Textarea", "Select", "Checkbox", "Radio", "Switch", "Modal", "PageHeader", "SectionHeader", "Money", "OwnerActionItem"]) assert.match(index, new RegExp(`\\b${name}\\b`));
});

test("form controls associate errors, descriptions, disabled reasons and pending state", () => {
  assert.match(controls, /htmlFor=\{inputId\}/);
  assert.match(controls, /aria-invalid/);
  assert.match(controls, /aria-describedby/);
  assert.match(controls, /aria-busy/);
  assert.match(controls, /role="switch"/);
});

test("modal contract contains dialog semantics, containment, escape, restoration and scroll lock", () => {
  for (const contract of [/role="dialog"/, /aria-modal="true"/, /event\.key === "Escape"/, /event\.key !== "Tab"/, /returnFocusRef\.current/, /document\.body\.style\.overflow/, /closeOnOverlay/, /kv-modal--destructive/]) assert.match(modal, contract);
});

test("Money fails closed and distinguishes zero, forecast and evidence-verified actual", () => {
  assert.equal(resolveMoneyDisplay({ value: null, currency: "JPY" }).state, "unknown");
  assert.equal(resolveMoneyDisplay({ value: 0, currency: "JPY", kind: "forecast" }).state, "zero");
  assert.equal(resolveMoneyDisplay({ value: 10, currency: "JPY", kind: "forecast" }).kind, "forecast");
  assert.equal(resolveMoneyDisplay({ value: 10, currency: "JPY", kind: "actual" }).state, "unknown");
  assert.equal(resolveMoneyDisplay({ value: 10, currency: "JPY", kind: "actual", evidenceVerified: true }).kind, "actual");
  assert.equal(resolveMoneyDisplay({ value: 10, kind: "forecast" }).state, "unknown");
});

test("OwnerActionItem remains callback-driven presentation", () => {
  assert.match(ownerAction, /onClick=\{onAction\}/);
  assert.doesNotMatch(ownerAction, /repositor|supabase|fetch\(|rpc\(/i);
});

test("Developer Mode is exact, fail-closed and only guards lazy component Labs", () => {
  assert.equal(isDeveloperModeEnabled("true"), true);
  for (const value of [undefined, "false", "TRUE", "1", true]) assert.equal(isDeveloperModeEnabled(value), false);
  assert.match(router, /lazy\(\(\) => import\("\.\.\/labs\/ComponentPreview\.jsx"\)\)/);
  assert.match(router, /isDeveloperModeEnabled\(\) \? <ComponentPreview \/> : <MessageRoute title="404 Not Found" \/>/);
  assert.doesNotMatch(routes, /path: "\/labs/);
});

test("Labs preview is fixture-only and has no Production integration", () => {
  assert.match(labs, /Static fixtures only/);
  assert.doesNotMatch(labs, /from ["'][^"']*(repositor|supabase|provider)|rpc\(|fetch\(|useLocalStorage|mutation/i);
});
