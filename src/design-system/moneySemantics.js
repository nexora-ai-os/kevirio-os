export function resolveMoneyDisplay({ value, currency, locale, kind = "unknown", evidenceVerified = false, unknownLabel = "Unknown" }) {
  const numeric = typeof value === "number" && Number.isFinite(value);
  const safeKind = kind === "forecast" || kind === "actual" ? kind : "unknown";
  const verified = safeKind !== "actual" || evidenceVerified === true;
  if (!numeric || !currency || safeKind === "unknown" || !verified) return { state: "unknown", kind: "unknown", text: unknownLabel };
  try {
    return { state: value === 0 ? "zero" : safeKind, kind: safeKind, text: new Intl.NumberFormat(locale, { style: "currency", currency }).format(value) };
  } catch {
    return { state: "unknown", kind: "unknown", text: unknownLabel };
  }
}

export function resolveFinancialValue(value, { unknownLabel = "Unknown" } = {}) {
  return typeof value === "number" && Number.isFinite(value) ? value : unknownLabel;
}

export function resolveMinorMoneyDisplay(options) {
  const { value, unknownLabel = "Unknown" } = options;
  if (typeof value !== "number" || !Number.isFinite(value)) return { state: "unknown", kind: "unknown", text: unknownLabel };
  return resolveMoneyDisplay({ ...options, value: value / 100 });
}
