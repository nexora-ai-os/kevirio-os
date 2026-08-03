import React from "react";

export function PageHeader({ title, description, eyebrow, actions, variant = "standard", accent = "gold", identity = false, className = "" }) {
  return <header className={`kv-page-header kv-page-hero kv-page-hero--${variant} kv-page-hero--${accent} ${className}`.trim()} data-hero-variant={variant}><div className="kv-page-hero__content">{eyebrow ? <p className="kv-header__eyebrow">{eyebrow}</p> : null}<h1>{title}</h1>{description ? <p className="kv-header__description">{description}</p> : null}</div>{actions ? <div className="kv-header__actions">{actions}</div> : null}{identity ? <span className="kv-page-hero__identity" aria-hidden="true">K</span> : null}</header>;
}

export function SectionHeader({ title, description, actions, headingLevel = 2, className = "" }) {
  const Heading = `h${Math.min(6, Math.max(2, Number(headingLevel) || 2))}`;
  return <header className={`kv-section-header ${className}`.trim()}><div><Heading>{title}</Heading>{description ? <p className="kv-header__description">{description}</p> : null}</div>{actions ? <div className="kv-header__actions">{actions}</div> : null}</header>;
}
