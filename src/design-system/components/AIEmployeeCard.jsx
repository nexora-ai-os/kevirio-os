import React from "react";
import { Badge, EnvironmentBadge } from "./Badge.jsx";
import { Card } from "./Card.jsx";

export function AIEmployeeCard({ name, role, maturity = "locked", status = "unknown", activeTask, permission, provider, costToday, lastActivity, externalExecution = "locked", action, className = "" }) {
  return <Card variant="employee" className={`kv-employee-card ${className}`.trim()}><div className="kv-employee-card__header"><div className="kv-employee-card__monogram" aria-hidden="true">{name?.slice(0, 2).toUpperCase()}</div><div><h2>{name}</h2><p>{role}</p></div><Badge state={status} label={maturity} /></div><dl className="kv-detail-list"><div><dt>Current task</dt><dd>{activeTask || "Unknown"}</dd></div><div><dt>Permission</dt><dd>{permission || "Unknown"}</dd></div><div><dt>Provider</dt><dd>{provider || "None"}</dd></div><div><dt>Cost today</dt><dd>{costToday ?? "Unknown"}</dd></div><div><dt>Last activity</dt><dd>{lastActivity || "Unknown"}</dd></div><div><dt>External execution</dt><dd><EnvironmentBadge environment={externalExecution} /></dd></div></dl>{action ? <div className="kv-card-action">{action}</div> : null}</Card>;
}
