import BrandMark from "./BrandMark";

const primaryItems = [
  ["review", "成果物レビュー"],
  ["home", "Home"],
  ["campaign", "Campaign"],
  ["approval", "Approval"],
  ["analytics", "Analytics"],
  ["apiCenter", "API / AI"],
  ["operations", "Operations"],
];

const advancedItems = [
  ["ceo", "AI CEO"],
  ["memory", "Business Memory"],
  ["opportunity", "Opportunity"],
  ["trends", "Trend"],
  ["workflows", "Workflow"],
  ["dashboard", "Mission"],
  ["workEngine", "Work Engine"],
  ["work", "Work Command"],
  ["affiliate", "Affiliate"],
  ["content", "Content"],
  ["assistant", "AI Companion"],
  ["settings", "Settings"],
];

const iconPaths = {
  review: "M5 5h14v14H5z M8 9h8 M8 13h5",
  home: "M4 11l8-7 8 7 M6 10v10h12V10",
  campaign: "M5 13l9-8 2 2-8 9-4 1z M14 5l5-2-2 5",
  approval: "M4 12l5 5L20 6",
  analytics: "M5 19V9 M12 19V5 M19 19v-8",
  apiCenter: "M8 8h8v8H8z M3 12h5 M16 12h5 M12 3v5 M12 16v5",
  operations: "M12 8a4 4 0 100 8 4 4 0 000-8z M12 3v3 M12 18v3 M3 12h3 M18 12h3 M5 5l2 2 M17 17l2 2 M19 5l-2 2 M7 17l-2 2",
  ceo: "M5 8l4 3 3-6 3 6 4-3-1 10H6z",
  memory: "M7 7h10v10H7z M4 10h3 M17 10h3 M4 14h3 M17 14h3 M10 4v3 M14 4v3 M10 17v3 M14 17v3",
  opportunity: "M12 3v18 M7 7h7a3 3 0 010 6h-4a3 3 0 000 6h7",
  trends: "M4 15l5-5 4 4 7-8 M17 6h3v3",
  workflows: "M6 6h5v5H6z M13 13h5v5h-5z M11 9h3 M10 11l4 4",
  dashboard: "M12 4l2 5h5l-4 3 2 5-5-3-5 3 2-5-4-3h5z",
  workEngine: "M7 7h10v10H7z M10 10h4v4h-4z",
  work: "M8 5h8l3 4v10H5V9z M8 5v4h11",
  affiliate: "M7 12a3 3 0 100-6 3 3 0 000 6z M17 18a3 3 0 100-6 3 3 0 000 6z M10 9l4 4",
  content: "M6 4h12v16H6z M9 8h6 M9 12h6 M9 16h4",
  assistant: "M12 4l1.5 4.5L18 10l-4.5 1.5L12 16l-1.5-4.5L6 10l4.5-1.5z",
  settings: "M12 8a4 4 0 100 8 4 4 0 000-8z M12 3v3 M12 18v3 M3 12h3 M18 12h3",
};

function NavIcon({ name }) {
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={iconPaths[name] ?? iconPaths.home} />
    </svg>
  );
}

export default function Sidebar({ page, setPage }) {
  const renderButton = ([key, label]) => (
    <button key={key} className={page === key ? "active" : ""} onClick={() => setPage(key)}>
      <NavIcon name={key} />
      <span>{label}</span>
    </button>
  );

  return (
    <aside className="sidebar">
      <div className="brand">
        <BrandMark size={48} />
        <div>
          <h2>KEVIRIO</h2>
          <p>Autonomous Business OS v5.0</p>
        </div>
      </div>

      <nav className="nav">
        <p className="nav-label">Command</p>
        {primaryItems.map(renderButton)}

        <p className="nav-label">Advanced Engines</p>
        {advancedItems.map(renderButton)}
      </nav>
    </aside>
  );
}
