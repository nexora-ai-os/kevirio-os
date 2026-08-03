import BrandMark from "./BrandMark";

// Canonical route names: Home, AI Employees, Approvals, Operations, Revenue, Insights, Integrations, Inbox, Audit, Settings.
const primaryItems = [["home", "ホーム"], ["googleOperations", "AI社員"], ["approval", "承認"], ["operations", "オペレーション"], ["production", "売上"], ["analytics", "インサイト"], ["providerHub", "連携"]];
const utilityItems = [["inbox", "受信箱"], ["audit", "監査"], ["settings", "設定"]];
const iconPaths = { home:"M4 11l8-7 8 7 M6 10v10h12V10",googleOperations:"M6 5h12v14H6z M9 9h6 M9 13h6",approval:"M4 12l5 5L20 6",operations:"M12 8a4 4 0 100 8 4 4 0 000-8z M12 3v3 M12 18v3 M3 12h3 M18 12h3",production:"M4 18h16 M6 15l4-4 3 2 5-6",analytics:"M5 19V9 M12 19V5 M19 19v-8",providerHub:"M5 6h14v5H5z M7 14h10v5H7z",inbox:"M4 5h16v14H4z M4 13h4l2 3h4l2-3h4",audit:"M6 4h12v16H6z M9 8h6 M9 12h6",settings:"M12 8a4 4 0 100 8 4 4 0 000-8z M12 3v3 M12 18v3" };
function NavIcon({ name }) { return <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true"><path d={iconPaths[name] || iconPaths.home} /></svg>; }

export default function Sidebar({ page, setPage, mobileOpen = false, onMobileClose }) {
  const renderButton = ([key, label]) => <button key={key} type="button" className={page === key ? "active" : ""} aria-current={page === key ? "page" : undefined} title={label} onClick={() => { setPage(key); onMobileClose?.(); }}><NavIcon name={key} /><span>{label}</span></button>;
  return <aside id="production-navigation" className={`sidebar ${mobileOpen ? "sidebar--open" : ""}`} aria-label="メインナビゲーション">
    <div className="brand"><BrandMark size={58} /><div><h2>KEVIRIO</h2><p>AI COMPANY OPERATING SYSTEM</p></div><button type="button" className="kv-sidebar-close" aria-label="ナビゲーションを閉じる" onClick={onMobileClose}>×</button></div>
    <nav className="nav" aria-label="プロダクションナビゲーション"><p className="nav-label">COMPANY</p>{primaryItems.map(renderButton)}<p className="nav-label">CONTROL</p>{utilityItems.map(renderButton)}</nav>
    <div className="kv-sidebar-status"><span className="kv-status-dot"/><span><strong>実行境界を保護中</strong><small>外部実行：ロック中</small></span></div>
  </aside>;
}
