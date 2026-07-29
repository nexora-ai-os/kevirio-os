import { ThemeProvider } from "../../design-system/index.js";
import "../../design-system/styles.css";
import "./shell.css";

export function ApplicationShell({ sidebar, topbar, overlays, children }) {
  return <ThemeProvider className="kv-production-theme"><a className="kv-skip-link" href="#main-content">Skip to content</a><div className="kv-app-shell">{sidebar}<div className="kv-app-column">{topbar ? <div className="kv-shell-topbar">{topbar}</div> : null}<PageWrapper>{children}</PageWrapper></div></div>{overlays}</ThemeProvider>;
}

export function ContentContainer({ as: Element = "div", children, className = "" }) {
  return <Element className={`kv-content-container ${className}`.trim()}>{children}</Element>;
}

export function PageWrapper({ children, className = "" }) {
  return <ContentContainer className={`kv-page-wrapper ${className}`.trim()}><div id="main-content" className="kv-page-content" tabIndex={-1}>{children}</div></ContentContainer>;
}
