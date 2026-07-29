export function isDeveloperModeEnabled(value = import.meta.env?.VITE_DEVELOPER_MODE) {
  return value === "true";
}
