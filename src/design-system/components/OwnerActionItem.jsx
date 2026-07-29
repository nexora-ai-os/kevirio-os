import React from "react";
import { Badge } from "./Badge.jsx";
import { Button } from "./Button.jsx";

export function OwnerActionItem({ title, description, state = "pending", metadata, actionLabel, onAction, actionDisabled = false, disabledReason, className = "" }) {
  return <article className={`kv-owner-action ${className}`.trim()}><div className="kv-owner-action__content"><div className="kv-owner-action__heading"><h3>{title}</h3><Badge state={state} /></div>{description ? <p>{description}</p> : null}{metadata ? <div className="kv-owner-action__metadata">{metadata}</div> : null}</div>{actionLabel ? <Button variant="secondary" onClick={onAction} disabled={actionDisabled || !onAction} disabledReason={disabledReason}>{actionLabel}</Button> : null}</article>;
}
