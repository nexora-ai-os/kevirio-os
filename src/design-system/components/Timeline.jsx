import React from "react";
import { EmptyState } from "./States.jsx";

export function Timeline({ items, emptyTitle = "No events", className = "" }) {
  if (!items?.length) return <EmptyState title={emptyTitle} />;
  return <ol className={`kv-timeline ${className}`.trim()}>{items.map((item, index) => <li key={item.id || index}><div className="kv-timeline__marker" aria-hidden="true" /><div><time dateTime={item.timestamp}>{item.timestamp ? new Date(item.timestamp).toLocaleString() : "Unknown time"}</time><h3>{item.title}</h3>{item.description ? <p>{item.description}</p> : null}{item.meta ? <div className="kv-timeline__meta">{item.meta}</div> : null}</div></li>)}</ol>;
}
