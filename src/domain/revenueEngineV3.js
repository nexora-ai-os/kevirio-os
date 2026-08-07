export const V3_REVENUE_ENGINE_TYPES = Object.freeze([
  "affiliate", "agency", "consulting", "marketplace", "digital_products", "subscriptions", "saas",
]);

export const V3_ENGINE_TO_CANONICAL_LANE = Object.freeze({
  affiliate: "affiliate",
  agency: "service",
  consulting: "service",
  marketplace: "media",
  digital_products: "digital_product",
  subscriptions: "digital_product",
  saas: "digital_product",
});

const CURRENCY = /^[A-Z]{3}$/;
const integer = (value) => Number.isSafeInteger(value) && value >= 0;

export function validateForecast(value = {}) {
  const errors = [];
  if (!V3_REVENUE_ENGINE_TYPES.includes(value.engineType)) errors.push("engineType_invalid");
  if (!CURRENCY.test(value.currency || "")) errors.push("currency_invalid");
  if (!integer(value.revenueMinor)) errors.push("revenueMinor_invalid");
  if (!integer(value.costMinor)) errors.push("costMinor_invalid");
  if (!value.assumption || !value.sourceReference) errors.push("forecast_provenance_required");
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors), truthClass: "Forecast" });
}

export function validateActualRevenue(record = {}, evidence = {}) {
  const errors = [];
  if (!record.id || !record.evidence_candidate_id) errors.push("actual_identity_required");
  if (record.evidence_candidate_id !== evidence.id || evidence.verification_status !== "verified") errors.push("verified_evidence_required");
  if (!CURRENCY.test(record.currency || "")) errors.push("currency_invalid");
  for (const field of ["gross_amount_minor", "cost_amount_minor"]) if (!integer(record[field])) errors.push(`${field}_invalid`);
  if (!Number.isSafeInteger(record.net_amount_minor) || record.net_amount_minor !== record.gross_amount_minor - record.cost_amount_minor) errors.push("net_amount_invalid");
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors), truthClass: errors.length ? "Unknown" : "Actual" });
}

export function calculateRevenuePerformance({ actual = [], evidence = [], forecasts = [] } = {}) {
  const evidenceById = new Map(evidence.map((item) => [item.id, item]));
  const byCurrency = new Map();
  for (const record of actual) {
    if (!validateActualRevenue(record, evidenceById.get(record.evidence_candidate_id)).valid) continue;
    const row = byCurrency.get(record.currency) || { currency:record.currency, grossMinor:0, costMinor:0, profitMinor:0, actualCount:0 };
    row.grossMinor += record.gross_amount_minor; row.costMinor += record.cost_amount_minor; row.profitMinor += record.net_amount_minor; row.actualCount += 1;
    byCurrency.set(record.currency, row);
  }
  const actualByCurrency = [...byCurrency.values()].map((row) => Object.freeze({ ...row, roi:row.costMinor > 0 ? row.profitMinor / row.costMinor : null, truthClass:"Actual" }));
  const validForecasts = forecasts.filter((item) => validateForecast(item).valid).map((item) => Object.freeze({ ...item, profitMinor:item.revenueMinor-item.costMinor, roi:item.costMinor > 0 ? (item.revenueMinor-item.costMinor)/item.costMinor : null, truthClass:"Forecast" }));
  return Object.freeze({ actual:Object.freeze(actualByCurrency), forecast:Object.freeze(validForecasts), externalExecution:false });
}
