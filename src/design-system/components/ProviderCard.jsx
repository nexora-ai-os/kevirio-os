import React from "react";
import { Badge } from "./Badge.jsx";
import { Button } from "./Button.jsx";
import { Card } from "./Card.jsx";

export function ProviderCard({ provider, maturity = "locked", connection, credentialStorage = "Server only", readCapability, writeCapability, scope, quota, costGuard, health, ownerAction, externalExecution = false, className = "" }) {
  return <Card variant="provider" className={`kv-provider-card ${className}`.trim()}><div className="kv-provider-card__header"><div><p className="kv-card-eyebrow">Provider</p><h2>{provider}</h2></div><Badge state={connection === "connected" ? "ready" : "locked"} label={maturity} /></div><dl className="kv-detail-list"><div><dt>Connection</dt><dd>{connection || "Unknown"}</dd></div><div><dt>Credential storage</dt><dd>{credentialStorage}</dd></div><div><dt>Read</dt><dd>{readCapability || "Unknown"}</dd></div><div><dt>Write</dt><dd>{writeCapability || "Locked"}</dd></div><div><dt>Scope</dt><dd>{scope || "None"}</dd></div><div><dt>Quota</dt><dd>{quota || "Unknown"}</dd></div><div><dt>Cost Guard</dt><dd>{costGuard || "Unavailable"}</dd></div><div><dt>Last health event</dt><dd>{health || "Unknown"}</dd></div><div><dt>External execution</dt><dd>{externalExecution ? "Enabled" : "LOCKED"}</dd></div></dl><div className="kv-card-action"><div><strong>Next Owner action</strong><p>{ownerAction || "None"}</p></div><Button variant="secondary" disabled disabledReason="No secure Production action is available from this screen">Manage</Button></div></Card>;
}
