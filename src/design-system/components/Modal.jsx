import React, { useEffect, useId, useRef } from "react";
import { Button } from "./Button.jsx";

const FOCUSABLE = "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";

export function Modal({ open, title, children, onClose, closeOnOverlay = true, destructive = false, closeLabel = "Close", className = "" }) {
  const titleId = useId();
  const dialogRef = useRef(null);
  const returnFocusRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    returnFocusRef.current = document.activeElement;
    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const dialog = dialogRef.current;
    const first = dialog?.querySelector(FOCUSABLE);
    (first || dialog)?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape") { event.preventDefault(); onClose?.(); return; }
      if (event.key !== "Tab" || !dialog) return;
      const items = [...dialog.querySelectorAll(FOCUSABLE)];
      if (!items.length) { event.preventDefault(); dialog.focus(); return; }
      const firstItem = items[0]; const lastItem = items.at(-1);
      if (event.shiftKey && document.activeElement === firstItem) { event.preventDefault(); lastItem.focus(); }
      else if (!event.shiftKey && document.activeElement === lastItem) { event.preventDefault(); firstItem.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("keydown", onKeyDown); document.body.style.overflow = priorOverflow; returnFocusRef.current?.focus?.(); };
  }, [open, onClose]);
  if (!open) return null;
  return <div className="kv-modal-layer" onMouseDown={(event) => { if (closeOnOverlay && event.target === event.currentTarget) onClose?.(); }}><section ref={dialogRef} className={`kv-modal ${destructive ? "kv-modal--destructive" : ""} ${className}`.trim()} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}><header className="kv-modal__header"><h2 id={titleId}>{title}</h2><Button variant="icon" aria-label={closeLabel} onClick={onClose}>×</Button></header><div className="kv-modal__body">{children}</div></section></div>;
}
