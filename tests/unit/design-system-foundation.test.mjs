import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { COST_STATE, ENVIRONMENT, UI_STATE, getEnvironmentMeta, getSemanticState, normalizeUIState } from "../../src/design-system/semanticState.js";

const tokens = readFileSync(new URL("../../src/design-system/tokens.css", import.meta.url), "utf8");
const base = readFileSync(new URL("../../src/design-system/base.css", import.meta.url), "utf8");
const components = readFileSync(new URL("../../src/design-system/components.css", import.meta.url), "utf8");
const main = readFileSync(new URL("../../src/main.jsx", import.meta.url), "utf8");
const styleEntry = readFileSync(new URL("../../src/design-system/styles.css", import.meta.url), "utf8");

test("semantic state registry is exhaustive and unknown fails closed", () => {
  assert.equal(Object.values(UI_STATE).length, 16);
  for (const state of Object.values(UI_STATE)) assert.ok(getSemanticState(state), state);
  assert.equal(normalizeUIState("not-a-state"), UI_STATE.UNKNOWN);
  assert.equal(getSemanticState("not-a-state").label, "不明");
});

test("environment and cost enums preserve locked and unavailable states", () => {
  assert.equal(getEnvironmentMeta(ENVIRONMENT.PRODUCTION).label, "PRODUCTION DATA");
  assert.equal(getEnvironmentMeta("invalid").label, "LOCKED");
  assert.equal(COST_STATE.UNAVAILABLE, "unavailable");
});

test("RC1 token categories and reduced motion contract exist", () => {
  for (const token of ["--color-bg-canvas", "--color-brand-gold-500", "--color-actual", "--space-20", "--radius-xl", "--shadow-focus", "--motion-base", "--text-heading-xl-size"]) assert.match(tokens, new RegExp(token));
  assert.match(base, /prefers-reduced-motion:\s*reduce/);
  assert.match(base, /:focus-visible/);
});

test("shared components define state, focus and responsive foundations", () => {
  assert.match(components, /\.kv-button:disabled/);
  assert.match(components, /\.kv-badge--actual/);
  assert.match(components, /\.kv-card--error/);
  assert.match(components, /\.kv-skeleton/);
  assert.match(components, /@media \(max-width: 767px\)/);
  assert.match(styleEntry, /@import "\.\/tokens\.css"/);
});

test("Phase 2 foundation is not imported by the production entry", () => {
  assert.doesNotMatch(main, /design-system/);
});
