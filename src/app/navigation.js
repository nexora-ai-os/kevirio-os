export const NAVIGATION_SECTIONS = Object.freeze(["COMPANY", "BUSINESS", "CONTROL"]);

export const NAVIGATION_ITEMS = Object.freeze([
  { id:"home", label:"ホーム", route:"/home", icon:"home", section:"COMPANY", visibility:"always", exact:true, badgeSlot:null, permission:null },
  { id:"googleOperations", label:"AI社員", route:"/employees/google_operations", icon:"employee", section:"COMPANY", visibility:"always", exact:false, badgeSlot:null, permission:null },
  { id:"approval", label:"承認", route:"/approvals", icon:"approval", section:"COMPANY", visibility:"always", exact:false, badgeSlot:null, permission:null },
  { id:"operations", label:"オペレーション", route:"/operations", icon:"operations", section:"COMPANY", visibility:"always", exact:false, badgeSlot:null, permission:null },
  { id:"production", label:"売上", route:"/revenue", icon:"revenue", section:"COMPANY", visibility:"always", exact:false, badgeSlot:null, permission:null },
  { id:"analytics", label:"インサイト", route:"/insights", icon:"analytics", section:"COMPANY", visibility:"always", exact:true, badgeSlot:null, permission:null },
  { id:"providerHub", label:"連携", route:"/integrations", icon:"integrations", section:"COMPANY", visibility:"always", exact:false, badgeSlot:null, permission:null },
  { id:"companyCore", label:"Company Core", route:"/company-core", icon:"company", section:"BUSINESS", visibility:"always", exact:false, badgeSlot:null, permission:null },
  { id:"businessIntelligence", label:"Business Intelligence", route:"/business-intelligence", icon:"analytics", section:"BUSINESS", visibility:"always", exact:true, badgeSlot:null, permission:null },
  { id:"affiliate", label:"Affiliate Intelligence", route:"/affiliate-intelligence", icon:"affiliate", section:"BUSINESS", visibility:"always", exact:false, badgeSlot:null, permission:null },
  { id:"publicationWorkspace", label:"Publication Workspace", route:null, routeView:"publication", icon:"publication", section:"BUSINESS", visibility:"contextual", exact:true, badgeSlot:null, permission:null, parentId:"affiliate" },
  { id:"revenueWorkspace", label:"Revenue Workspace", route:null, routeView:"revenue", icon:"revenue", section:"BUSINESS", visibility:"contextual", exact:true, badgeSlot:null, permission:null, parentId:"affiliate" },
  { id:"inbox", label:"受信箱", route:"/inbox", icon:"inbox", section:"CONTROL", visibility:"always", exact:true, badgeSlot:null, permission:null },
  { id:"audit", label:"監査", route:"/audit", icon:"audit", section:"CONTROL", visibility:"always", exact:true, badgeSlot:null, permission:null },
  { id:"settings", label:"設定", route:"/settings", icon:"settings", section:"CONTROL", visibility:"always", exact:true, badgeSlot:null, permission:null },
]);

const byId = new Map(NAVIGATION_ITEMS.map((item) => [item.id, item]));
const contextualMatch = /^\/affiliate-intelligence\/([^/]+)\/(publication|revenue)\/?$/;

export function resolveNavigationRoute(item, pathname = "/") {
  if (item.route) return item.route;
  const programId = pathname.match(/^\/affiliate-intelligence\/([^/]+)/)?.[1];
  return programId && item.routeView ? `/affiliate-intelligence/${programId}/${item.routeView}` : null;
}

export function isNavigationItemVisible(item, pathname) {
  return item.visibility === "always" || Boolean(resolveNavigationRoute(item, pathname));
}

export function isNavigationItemActive(item, pathname) {
  const normalized = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  const resolved = resolveNavigationRoute(item, normalized);
  if (!resolved) return false;
  if (item.id === "affiliate" && contextualMatch.test(normalized)) return false;
  return item.exact ? normalized === resolved : normalized === resolved || normalized.startsWith(`${resolved}/`);
}

export function navigationContext(pathname) {
  const current = NAVIGATION_ITEMS.find((item) => item.visibility === "contextual" && isNavigationItemActive(item, pathname))
    || NAVIGATION_ITEMS.find((item) => isNavigationItemActive(item, pathname))
    || byId.get("home");
  const parent = current.parentId ? byId.get(current.parentId) : null;
  const crumbs = [];
  if (current.section === "BUSINESS") crumbs.push({ id:"business", label:"Business", route:null });
  if (parent) crumbs.push({ id:parent.id, label:parent.label, route:resolveNavigationRoute(parent, pathname) });
  crumbs.push({ id:current.id, label:current.label, route:null, current:true });
  return { current, title:current.label, crumbs };
}
