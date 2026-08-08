import React from "react";
import { Badge } from "./Badge.jsx";
import { Card } from "./Card.jsx";

export function KpiCard({ label, value, period, state = "unknown", comparison, trend, freshness, className = "" }) {
  const renderedValue = value === null || value === undefined || value === "" || (typeof value === "number" && !Number.isFinite(value)) ? "Unknown" : value;
  return <Card variant="kpi" className={`kv-kpi-card ${className}`.trim()}><div className="kv-kpi-card__header"><span>{label}</span><Badge state={state} size="sm" /></div><strong className="kv-kpi-card__value">{renderedValue}</strong>{period ? <span>{period}</span> : null}{comparison ? <small>{comparison}</small> : null}{trend ? <small>{trend}</small> : null}{freshness ? <small>Updated: {freshness}</small> : null}</Card>;
}
