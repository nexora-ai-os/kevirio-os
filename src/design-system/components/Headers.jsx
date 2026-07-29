import React from "react";

export function PageHeader({ title, description, eyebrow, actions, className = "" }) {
  return <header className={`kv-page-header ${className}`.trim()}><div>{eyebrow ? <p className="kv-header__eyebrow">{eyebrow}</p> : null}<h1>{title}</h1>{description ? <p className="kv-header__description">{description}</p> : null}</div>{actions ? <div className="kv-header__actions">{actions}</div> : null}</header>;
}

export function SectionHeader({ title, description, actions, headingLevel = 2, className = "" }) {
  const Heading = `h${Math.min(6, Math.max(2, Number(headingLevel) || 2))}`;
  return <header className={`kv-section-header ${className}`.trim()}><div><Heading>{title}</Heading>{description ? <p className="kv-header__description">{description}</p> : null}</div>{actions ? <div className="kv-header__actions">{actions}</div> : null}</header>;
}
