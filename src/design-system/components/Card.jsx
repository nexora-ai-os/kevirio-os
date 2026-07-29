import React from "react";

const VARIANTS = new Set(["surface", "decision", "kpi", "status", "employee", "provider", "approval", "audit", "warning", "error", "empty"]);

export function Card({ as: Element = "section", children, variant = "surface", className = "", labelledBy, ...props }) {
  const safeVariant = VARIANTS.has(variant) ? variant : "surface";
  return <Element {...props} className={`kv-card kv-card--${safeVariant} ${className}`.trim()} aria-labelledby={labelledBy}>{children}</Element>;
}
