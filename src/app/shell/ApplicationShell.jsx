import { cloneElement, isValidElement, useCallback, useEffect, useState } from "react";
import { ThemeProvider } from "../../design-system/index.js";
import "../../design-system/styles.css";
import "./shell.css";

export function ApplicationShell({ sidebar, topbar, overlays, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = useCallback(() => {
    setMobileOpen(false);
    requestAnimationFrame(() => document.querySelector(".kv-mobile-menu")?.focus());
  }, []);
  useEffect(() => {
    if (!mobileOpen) return undefined;
    requestAnimationFrame(() => document.querySelector(".kv-sidebar-close")?.focus());
    const close = (event) => { if (event.key === "Escape") closeMobile(); };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [mobileOpen, closeMobile]);
  const renderedSidebar = isValidElement(sidebar) ? cloneElement(sidebar, { mobileOpen, onMobileClose: closeMobile }) : sidebar;
  const renderedTopbar = isValidElement(topbar) ? cloneElement(topbar, { onMenuToggle: () => setMobileOpen((current) => !current), mobileOpen }) : topbar;
  return <ThemeProvider className="kv-production-theme">
    <a className="kv-skip-link" href="#main-content">本文へ移動</a>
    <div className="kv-app-shell">
      {renderedSidebar}
      {mobileOpen ? <button type="button" className="kv-drawer-backdrop" aria-label="ナビゲーションを閉じる" onClick={closeMobile} /> : null}
      <div className="kv-app-column">{topbar ? <div className="kv-shell-topbar">{renderedTopbar}</div> : null}<PageWrapper>{children}</PageWrapper></div>
    </div>
    {overlays}
  </ThemeProvider>;
}

export function ContentContainer({ as: Element = "div", children, className = "" }) {
  return <Element className={`kv-content-container ${className}`.trim()}>{children}</Element>;
}

export function PageWrapper({ children, className = "" }) {
  return <ContentContainer className={`kv-page-wrapper ${className}`.trim()}><div id="main-content" className="kv-page-content" tabIndex={-1}>{children}</div></ContentContainer>;
}
