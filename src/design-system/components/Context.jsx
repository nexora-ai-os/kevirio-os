import React from "react";
import { Badge } from "./Badge.jsx";

export function PageSection({ title, description, actions, children, className = "" }) {
  return <section className={`kv-page-section ${className}`.trim()}><header className="kv-page-section__header"><div><h2>{title}</h2>{description ? <p>{description}</p> : null}</div>{actions ? <div>{actions}</div> : null}</header><div className="kv-page-section__body">{children}</div></section>;
}

export function SystemBoundary({ title = "システム境界", state = "locked", description, items = [] }) {
  return <aside className="kv-system-boundary" aria-label={title}><div className="kv-system-boundary__title"><span aria-hidden="true">◇</span><div><p>SYSTEM BOUNDARY</p><h2>{title}</h2></div><Badge state={state} /></div>{description ? <p>{description}</p> : null}{items.length ? <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul> : null}</aside>;
}

export function InlineAlert({ tone = "info", title, children }) {
  return <div className={`kv-inline-alert kv-inline-alert--${tone}`} role={tone === "error" ? "alert" : "status"}><strong>{title}</strong>{children ? <span>{children}</span> : null}</div>;
}
