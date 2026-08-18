export const NAVIGATION_SECTIONS = Object.freeze(["今日の仕事", "集客・制作", "営業・収益", "組織・知識", "管理・安全"]);

export const NAVIGATION_ITEMS = Object.freeze([
{id:"home",label:"ホーム",route:"/home",icon:"home",section:"今日の仕事",visibility:"always",exact:true},{id:"assistant",label:"AI秘書",route:"/assistant",icon:"employee",section:"今日の仕事",visibility:"always",exact:true},{id:"goals",label:"目標・戦略",route:"/goals",icon:"approval",section:"今日の仕事",visibility:"always",exact:true},
{id:"sns",label:"SNS運用",route:"/sns",icon:"publication",section:"集客・制作",visibility:"always",exact:true},{id:"snsAnalytics",label:"SNS分析",route:"/sns-analytics",icon:"analytics",section:"集客・制作",visibility:"always",exact:true},{id:"content",label:"コンテンツ制作",route:"/content",icon:"publication",section:"集客・制作",visibility:"always",exact:true},{id:"note",label:"note",route:"/note",icon:"publication",section:"集客・制作",visibility:"always",exact:true},{id:"affiliate",label:"アフィリエイト",route:"/affiliate-intelligence",icon:"affiliate",section:"集客・制作",visibility:"always",exact:false},
{id:"opportunities",label:"仕事を探す",route:"/opportunities",icon:"operations",section:"営業・収益",visibility:"always",exact:true},{id:"outreach",label:"応募・営業",route:"/outreach",icon:"inbox",section:"営業・収益",visibility:"always",exact:true},{id:"projects",label:"案件・仕事",route:"/projects",icon:"operations",section:"営業・収益",visibility:"always",exact:true},{id:"studio",label:"制作スタジオ",route:"/studio",icon:"publication",section:"営業・収益",visibility:"always",exact:true},{id:"revenueCenter",label:"収益管理",route:"/revenue",icon:"revenue",section:"営業・収益",visibility:"always",exact:false},{id:"crm",label:"顧客・営業管理",route:"/crm",icon:"company",section:"営業・収益",visibility:"always",exact:true},
{id:"employees",label:"AI社員",route:"/employees",icon:"employee",section:"組織・知識",visibility:"always",exact:false},{id:"team",label:"チーム",route:"/team",icon:"company",section:"組織・知識",visibility:"always",exact:true},{id:"knowledge",label:"Knowledge",route:"/knowledge",icon:"publication",section:"組織・知識",visibility:"always",exact:true},{id:"analytics",label:"分析",route:"/insights",icon:"analytics",section:"組織・知識",visibility:"always",exact:true},
{id:"feedback",label:"改善BOX",route:"/feedback",icon:"inbox",section:"管理・安全",visibility:"always",exact:true},{id:"connectors",label:"接続・API",route:"/integrations",icon:"integrations",section:"管理・安全",visibility:"always",exact:false},{id:"safety",label:"監査・安全",route:"/audit",icon:"audit",section:"管理・安全",visibility:"always",exact:true},{id:"settings",label:"設定",route:"/settings",icon:"settings",section:"管理・安全",visibility:"always",exact:true},
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
  if (item.id === "affiliate" && contextualMatch.test(normalized)) return true;
  return item.exact ? normalized === resolved : normalized === resolved || normalized.startsWith(`${resolved}/`);
}

export function navigationContext(pathname) {
  const current = NAVIGATION_ITEMS.find((item) => item.visibility === "contextual" && isNavigationItemActive(item, pathname))
    || NAVIGATION_ITEMS.find((item) => isNavigationItemActive(item, pathname))
    || byId.get("home");
  const parent = current.parentId ? byId.get(current.parentId) : null;
  const crumbs = [];
  crumbs.push({ id:"section", label:current.section, route:null });
  if (parent) crumbs.push({ id:parent.id, label:parent.label, route:resolveNavigationRoute(parent, pathname) });
  crumbs.push({ id:current.id, label:current.label, route:null, current:true });
  return { current, title:current.label, crumbs };
}
