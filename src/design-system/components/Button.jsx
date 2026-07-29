import React, { useId } from "react";

const VARIANTS = new Set(["primary", "secondary", "quiet", "danger", "approval", "icon", "link"]);
const SIZES = new Set(["sm", "md", "lg"]);

export function Button({ children, variant = "primary", size = "md", loading = false, success = false, disabled = false, disabledReason, className = "", type = "button", ...props }) {
  const reasonId = useId();
  const safeVariant = VARIANTS.has(variant) ? variant : "primary";
  const safeSize = SIZES.has(size) ? size : "md";
  const isDisabled = disabled || loading;
  return <span className="kv-button-wrap"><button {...props} type={type} className={`kv-button kv-button--${safeVariant} kv-button--${safeSize} ${className}`.trim()} disabled={isDisabled} aria-busy={loading || undefined} aria-describedby={isDisabled && disabledReason ? reasonId : props["aria-describedby"]} data-success={success || undefined}>{loading ? <span className="kv-button__spinner" aria-hidden="true" /> : null}<span>{children}</span></button>{isDisabled && disabledReason ? <span id={reasonId} className="kv-disabled-reason">{disabledReason}</span> : null}</span>;
}
