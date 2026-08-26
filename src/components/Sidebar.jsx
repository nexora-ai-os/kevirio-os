import { useLocation, useNavigate } from "react-router-dom";
import { NAVIGATION_ITEMS, NAVIGATION_SECTIONS, isNavigationItemActive, isNavigationItemVisible, resolveNavigationRoute } from "../app/navigation.js";
import BrandMark from "./BrandMark";
import { useOwnerNavigationGuard } from "../app/ownerEditGuard.jsx";

const iconPaths={home:"M4 11l8-7 8 7 M6 10v10h12V10",employee:"M6 5h12v14H6z M9 9h6 M9 13h6",approval:"M4 12l5 5L20 6",operations:"M12 8a4 4 0 100 8 4 4 0 000-8z M12 3v3 M12 18v3 M3 12h3 M18 12h3",revenue:"M4 18h16 M6 15l4-4 3 2 5-6",analytics:"M5 19V9 M12 19V5 M19 19v-8",integrations:"M5 6h14v5H5z M7 14h10v5H7z",company:"M5 20V6l7-3 7 3v14 M9 9h1 M14 9h1 M9 13h1 M14 13h1",affiliate:"M7 17l10-10 M8 7h.01 M16 17h.01",publication:"M5 4h14v16H5z M8 8h8 M8 12h8",inbox:"M4 5h16v14H4z M4 13h4l2 3h4l2-3h4",audit:"M6 4h12v16H6z M9 8h6 M9 12h6",settings:"M12 8a4 4 0 100 8 4 4 0 000-8z M12 3v3 M12 18v3"};
function NavIcon({name}){return <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true"><path d={iconPaths[name]||iconPaths.home}/></svg>}

export default function Sidebar({mobileOpen=false,onMobileClose,collapsed=false,onCollapseToggle}){
  const location=useLocation(),navigate=useNavigate();
  const editGuard=useOwnerNavigationGuard();
  const select=(item)=>{const route=resolveNavigationRoute(item,location.pathname);if(route&&editGuard?.confirmNavigation()!==false){navigate(route);onMobileClose?.()}};
  return <aside id="production-navigation" className={`sidebar ${mobileOpen?"sidebar--open":""} ${collapsed?"sidebar--collapsed":""}`} aria-label="メインナビゲーション">
    <div className="brand"><BrandMark size={58}/><div><h2>KEVIRIO</h2><p>AI COMPANY OPERATING SYSTEM</p></div><button type="button" className="kv-sidebar-close" aria-label="ナビゲーションを閉じる" onClick={onMobileClose}>×</button></div>
    <button type="button" className="kv-sidebar-collapse" aria-label={collapsed?"サイドバーを展開":"サイドバーを折りたたむ"} aria-pressed={collapsed} onClick={onCollapseToggle}>{collapsed?"›":"‹"}</button>
    <nav className="nav" aria-label="プロダクションナビゲーション">{NAVIGATION_SECTIONS.map((section)=>{const items=NAVIGATION_ITEMS.filter((item)=>item.section===section&&isNavigationItemVisible(item,location.pathname));return <div className="kv-nav-section" key={section}><p className="nav-label">{section}</p>{items.map((item)=>{const active=isNavigationItemActive(item,location.pathname);return <button key={item.id} type="button" className={active?"active":""} aria-current={active?"page":undefined} title={item.label} onClick={()=>select(item)}><NavIcon name={item.icon}/><span className="kv-nav-label">{item.label}</span></button>})}</div>})}</nav>
    <div className="kv-sidebar-status"><span className="kv-status-dot"/><span><strong>実行境界を保護中</strong><small>External Execution: LOCKED</small></span></div>
  </aside>;
}
