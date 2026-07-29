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
