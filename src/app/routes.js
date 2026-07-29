export const PAGE_PATHS = Object.freeze({
  home: "/home",
  googleOperations: "/employees/google_operations",
  approval: "/approvals",
  operations: "/operations",
  campaign: "/operations/offers",
  workflows: "/operations/workflows",
  production: "/revenue",
  analytics: "/insights",
  providerHub: "/integrations",
  settings: "/settings",
  inbox: "/inbox",
  audit: "/audit",
});

export const APP_ROUTES = Object.freeze([
  { path: "/home", page: "home" },
  { path: "/employees", page: "googleOperations" },
  { path: "/employees/:employeeId", page: "googleOperations" },
  { path: "/employees/:employeeId/tasks/:taskId", page: "googleOperations" },
  { path: "/approvals", page: "approval" },
  { path: "/approvals/:approvalId", page: "approval" },
  { path: "/operations", page: "operations" },
  { path: "/operations/offers", page: "campaign" },
  { path: "/operations/workflows", page: "operations" },
  { path: "/operations/:operationId", page: "operations" },
  { path: "/revenue", page: "production" },
  { path: "/revenue/actual", page: "production" },
  { path: "/revenue/forecast", page: "production" },
  { path: "/revenue/evidence", page: "production" },
  { path: "/revenue/campaigns", page: "production" },
  { path: "/revenue/records/:recordId", page: "production" },
  { path: "/insights", page: "analytics" },
  { path: "/integrations", page: "providerHub" },
  { path: "/integrations/:providerId", page: "providerHub" },
  { path: "/settings", page: "settings" },
  { path: "/inbox", page: "inbox" },
  { path: "/audit", page: "audit" },
]);

export const LEGACY_REDIRECTS = Object.freeze([
  { from: "/production", to: "/revenue" },
  { from: "/approval", to: "/approvals" },
  { from: "/campaign", to: "/operations/offers" },
  { from: "/analytics", to: "/insights" },
  { from: "/provider-hub", to: "/integrations" },
  { from: "/google-operations", to: "/employees/google_operations" },
]);

export function pathForPage(page) {
  return PAGE_PATHS[page] || "/home";
}
