import React from "react";
import { resolveMoneyDisplay } from "../moneySemantics.js";

export function Money({ value, currency, locale, kind = "unknown", evidenceVerified = false, unknownLabel = "Unknown", className = "" }) {
  const display = resolveMoneyDisplay({ value, currency, locale, kind, evidenceVerified, unknownLabel });
  if (display.kind === "unknown") return <span className={`kv-money kv-money--unknown ${className}`.trim()} data-money-state="unknown">{display.text}</span>;
  return <span className={`kv-money kv-money--${display.kind} ${className}`.trim()} data-money-state={display.state}><span>{display.text}</span><span className="sr-only"> {display.kind === "actual" ? "Actual" : "Forecast"}</span></span>;
}
