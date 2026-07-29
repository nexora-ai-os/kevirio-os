import BrandMark from "./BrandMark";

const primaryItems = [["home", "Home"], ["googleOperations", "AI Employees"], ["approval", "Approvals"], ["operations", "Operations"], ["production", "Revenue"], ["analytics", "Insights"], ["providerHub", "Integrations"]];
const utilityItems = [["inbox", "Inbox"], ["audit", "Audit"], ["settings", "Settings"]];
const iconPaths = { home:"M4 11l8-7 8 7 M6 10v10h12V10",googleOperations:"M6 5h12v14H6z M9 9h6 M9 13h6",approval:"M4 12l5 5L20 6",operations:"M12 8a4 4 0 100 8 4 4 0 000-8z M12 3v3 M12 18v3 M3 12h3 M18 12h3",production:"M4 18h16 M6 15l4-4 3 2 5-6",analytics:"M5 19V9 M12 19V5 M19 19v-8",providerHub:"M5 6h14v5H5z M7 14h10v5H7z",inbox:"M4 5h16v14H4z M4 13h4l2 3h4l2-3h4",audit:"M6 4h12v16H6z M9 8h6 M9 12h6",settings:"M12 8a4 4 0 100 8 4 4 0 000-8z M12 3v3 M12 18v3" };
function NavIcon({ name }) { return <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d={iconPaths[name] || iconPaths.home} /></svg>; }
export default function Sidebar({ page, setPage }) {
  const renderButton = ([key, label]) => <button key={key} type="button" className={page === key ? "active" : ""} aria-current={page === key ? "page" : undefined} onClick={() => setPage(key)}><NavIcon name={key} /><span>{label}</span></button>;
  return <aside className="sidebar" aria-label="Application navigation"><div className="brand"><BrandMark size={48} /><div><h2>KEVIRIO</h2><p>AI Company Operating System</p></div></div><nav className="nav" aria-label="Primary navigation"><p className="nav-label">Production</p>{primaryItems.map(renderButton)}<p className="nav-label">Utility</p>{utilityItems.map(renderButton)}</nav></aside>;
}
