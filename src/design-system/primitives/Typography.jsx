import React from "react";

export function Heading({ as: Element = "h2", children, className = "", size = "lg" }) {
  return <Element className={`kv-heading kv-heading--${size} ${className}`.trim()}>{children}</Element>;
}

export function Text({ as: Element = "p", children, className = "", size = "md", tone = "primary" }) {
  return <Element className={`kv-text kv-text--${size} kv-text--${tone} ${className}`.trim()}>{children}</Element>;
}

export function MonoText({ as: Element = "code", children, className = "" }) {
  return <Element className={`kv-mono ${className}`.trim()}>{children}</Element>;
}
