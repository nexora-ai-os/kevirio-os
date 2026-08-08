import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolveFinancialValue, resolveMinorMoneyDisplay, resolveMoneyDisplay } from "../../src/design-system/moneySemantics.js";
import { commandCenterViewModel, moneyLabel } from "../../src/components/affiliate-v2/viewModels/affiliateV2ViewModel.js";
import { revenueWorkspaceViewModel } from "../../src/components/affiliate-v2/viewModels/affiliateV3WorkspaceViewModel.js";

const actualMoney = (value) => resolveMoneyDisplay({ value, currency: "JPY", locale: "ja-JP", kind: "actual", evidenceVerified: true });

test("canonical financial presentation preserves finite Actual and explicit zero", () => {
  assert.match(actualMoney(1250).text, /1,250/);
  assert.equal(actualMoney(0).state, "zero");
  assert.match(resolveMinorMoneyDisplay({ value: 125000, currency: "JPY", locale: "ja-JP", kind: "actual", evidenceVerified: true }).text, /1,250/);
});

test("missing and non-finite values always fail closed to Unknown", () => {
  for (const value of [undefined, null, NaN, Infinity, -Infinity, "100", {}, "[object Object]"]) {
    assert.equal(resolveFinancialValue(value), "Unknown");
    assert.equal(resolveMinorMoneyDisplay({ value, currency: "JPY", kind: "actual", evidenceVerified: true }).text, "Unknown");
  }
});

test("Forecast remains separate and Test or Mock never become Actual", () => {
  assert.equal(resolveMinorMoneyDisplay({ value: 10000, currency: "JPY", kind: "forecast" }).kind, "forecast");
  for (const kind of ["test", "mock", "unknown"]) assert.equal(resolveMinorMoneyDisplay({ value: 10000, currency: "JPY", kind }).text, "Unknown");
});

test("Affiliate command-center money cannot render invalid currency or non-finite KPI values", () => {
  for (const value of [undefined, null, NaN, Infinity, -Infinity]) assert.equal(moneyLabel(value, "JPY", "actual", true), "Unknown");
  assert.equal(moneyLabel(10000, "INVALID", "actual", true), "Unknown");
  const model = commandCenterViewModel({ kpis: { actualRevenue: NaN, actualCost: Infinity, netProfit: undefined } });
  for (const item of model.kpis.slice(0, 3)) assert.deepEqual({ value: item.value, truth: item.truth }, { value: "Unknown", truth: "Unknown" });
});

test("Affiliate revenue workspace keeps missing inputs Unknown and zero denominator ROI null", () => {
  const empty = revenueWorkspaceViewModel();
  assert.equal(empty.actualApprovedRevenue, "Unknown");
  assert.equal(empty.roi, null);
  const zero = revenueWorkspaceViewModel({ performance: [{ approved_revenue_minor: 0, pending_revenue_minor: 0, rejected_revenue_minor: 0, cost_minor: 0, clicks: 0, conversions: 0 }] });
  assert.equal(zero.actualApprovedRevenue, 0);
  assert.equal(zero.netProfit, 0);
  assert.equal(zero.roi, null);
  const missing = revenueWorkspaceViewModel({ performance: [{ approved_revenue_minor: undefined, pending_revenue_minor: 0, rejected_revenue_minor: 0, cost_minor: 10, clicks: 0, conversions: 0 }] });
  assert.equal(missing.actualApprovedRevenue, "Unknown");
  assert.equal(missing.netProfit, "Unknown");
  assert.equal(missing.truthClass, "Unknown");
});

test("KpiCard and BI presentation use the shared finite-value boundary", () => {
  const kpi = readFileSync(new URL("../../src/design-system/components/KpiCard.jsx", import.meta.url), "utf8");
  const bi = readFileSync(new URL("../../src/components/CompanyCoreV3Workspace.jsx", import.meta.url), "utf8");
  assert.match(kpi, /typeof value === "number" && !Number\.isFinite\(value\)/);
  assert.match(bi, /const show=resolveFinancialValue/);
  assert.doesNotMatch(bi, /typeof value==="number"/);
});
