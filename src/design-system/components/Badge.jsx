import React from "react";
import { getEnvironmentMeta, getSemanticState, normalizeUIState } from "../semanticState.js";
import { StateIcon } from "./StateIcon.jsx";

export function Badge({ state = "unknown", label, environment, size = "md", icon, ariaLabel, className = "" }) {
  const normalized = normalizeUIState(state);
  const meta = getSemanticState(normalized);
  return <span className={`kv-badge kv-badge--${meta.tone} kv-badge--${size} kv-badge--border-${meta.border} ${className}`.trim()}><StateIcon name={icon || meta.icon} className="kv-badge__icon" /><span>{label || meta.label}</span>{environment ? <span className="sr-only">{getEnvironmentMeta(environment).label}</span> : null}</span>;
}

export function EnvironmentBadge({ environment = "locked", className = "" }) {
  const meta = getEnvironmentMeta(environment);
  return <Badge state={meta.state} label={meta.label} environment={environment} className={className} ariaLabel={`Environment: ${meta.label}`} />;
}
