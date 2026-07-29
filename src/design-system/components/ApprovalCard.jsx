import React from "react";
import { Badge } from "./Badge.jsx";
import { Card } from "./Card.jsx";

export function ApprovalCard({ variant = "standard", title, target, capability, risk, costCeiling, expiry, version, state = "pending", effect, children, actions, className = "" }) {
  return <Card variant="approval" className={`kv-approval-card kv-approval-card--${variant} ${className}`.trim()}><div className="kv-approval-card__header"><div><p className="kv-card-eyebrow">{variant.replaceAll("_", " ")}</p><h2>{title}</h2></div><Badge state={state} /></div><dl className="kv-detail-list"><div><dt>Target</dt><dd>{target || "Unknown"}</dd></div><div><dt>Capability</dt><dd>{capability || "Unknown"}</dd></div><div><dt>Risk</dt><dd>{risk || "Unknown"}</dd></div><div><dt>Cost ceiling</dt><dd>{costCeiling ?? "Unknown"}</dd></div><div><dt>Expiry</dt><dd>{expiry || "Unknown"}</dd></div><div><dt>Version</dt><dd>{version || "Unknown"}</dd></div><div><dt>Effect</dt><dd>{effect || "No external execution"}</dd></div></dl>{children}{actions ? <div className="kv-card-action">{actions}</div> : null}</Card>;
}
