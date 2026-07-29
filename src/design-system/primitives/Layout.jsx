import React from "react";

export function Container({ as: Element = "div", children, className = "", size = "wide" }) {
  return <Element className={`kv-container kv-container--${size} ${className}`.trim()}>{children}</Element>;
}

export function Stack({ as: Element = "div", children, className = "", gap = "4" }) {
  return <Element className={`kv-stack kv-gap--${gap} ${className}`.trim()}>{children}</Element>;
}

export function Cluster({ as: Element = "div", children, className = "", gap = "3", align = "center" }) {
  return <Element className={`kv-cluster kv-gap--${gap} kv-align--${align} ${className}`.trim()}>{children}</Element>;
}

export function Grid({ as: Element = "div", children, className = "", columns = "auto", gap = "4" }) {
  return <Element className={`kv-grid kv-grid--${columns} kv-gap--${gap} ${className}`.trim()}>{children}</Element>;
}
