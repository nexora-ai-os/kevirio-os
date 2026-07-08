import React from "react";

export function PageContainer({ children, className = "" }) {
  return <main className={`content ${className}`.trim()}>{children}</main>;
}

export function SectionTitle({ eyebrow, title, action, badge }) {
  return (
    <div className="section-head">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
      </div>
      <div className="section-head-actions">
        {badge ? <span className="badge">{badge}</span> : null}
        {action}
      </div>
    </div>
  );
}

export function GlassPanel({ children, className = "", compact = false }) {
  return <section className={`panel ${compact ? "panel-compact" : ""} ${className}`.trim()}>{children}</section>;
}

export function StatusBadge({ status }) {
  const label = status || "ready";
  const tone = label === "connected" || label === "active" || label === "positive" ? "good" : label === "pending" || label === "ready" ? "soft" : "warning";
  return <span className={`status-badge ${tone}`}>{label}</span>;
}

export function Button({ children, onClick, variant = "primary", className = "", disabled = false }) {
  return (
    <button className={`ui-button ${variant} ${className}`.trim()} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function Card({ children, className = "" }) {
  return <div className={`card ${className}`.trim()}>{children}</div>;
}

export function Loading({ label = "読み込み中" }) {
  return <div className="loading-state">{label}</div>;
}

export function EmptyState({ title, message }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <p>{message}</p>
    </div>
  );
}
