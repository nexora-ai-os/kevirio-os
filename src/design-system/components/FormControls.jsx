import React, { createContext, useContext, useId } from "react";

const FieldContext = createContext(null);

export function FormField({ label, description, error, required = false, disabledReason, children, className = "" }) {
  const generatedId = useId();
  const inputId = `kv-field-${generatedId.replace(/:/g, "")}`;
  const descriptionId = description ? `${inputId}-description` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const disabledReasonId = disabledReason ? `${inputId}-disabled` : undefined;
  const describedBy = [descriptionId, errorId, disabledReasonId].filter(Boolean).join(" ") || undefined;
  return <FieldContext.Provider value={{ inputId, describedBy, invalid: Boolean(error), required }}><div className={`kv-field ${error ? "kv-field--error" : ""} ${className}`.trim()}><label className="kv-field__label" htmlFor={inputId}>{label}{required ? <span aria-hidden="true"> *</span> : null}</label>{description ? <div id={descriptionId} className="kv-field__description">{description}</div> : null}<div className="kv-field__control">{children}</div>{error ? <div id={errorId} className="kv-field__error" role="alert">{error}</div> : null}{disabledReason ? <div id={disabledReasonId} className="kv-disabled-reason">{disabledReason}</div> : null}</div></FieldContext.Provider>;
}

function useControlProps(props) {
  const field = useContext(FieldContext);
  const pending = Boolean(props.pending);
  const describedBy = [field?.describedBy, props["aria-describedby"]].filter(Boolean).join(" ") || undefined;
  return { ...props, pending: undefined, id: props.id || field?.inputId, required: props.required ?? field?.required, "aria-invalid": props["aria-invalid"] ?? (field?.invalid || undefined), "aria-describedby": describedBy, "aria-busy": pending || undefined, disabled: props.disabled || pending };
}

export function Input(props) { return <input {...useControlProps(props)} className={`kv-control ${props.className || ""}`.trim()} />; }
export function Textarea(props) { return <textarea {...useControlProps(props)} className={`kv-control kv-textarea ${props.className || ""}`.trim()} />; }
export function Select({ children, ...props }) { return <select {...useControlProps(props)} className={`kv-control kv-select ${props.className || ""}`.trim()}>{children}</select>; }

function Choice({ type, label, disabledReason, className = "", ...props }) {
  const generatedId = useId();
  const id = props.id || `kv-${type}-${generatedId.replace(/:/g, "")}`;
  const reasonId = disabledReason ? `${id}-disabled` : undefined;
  const controlProps = useControlProps({ ...props, id, "aria-describedby": [props["aria-describedby"], reasonId].filter(Boolean).join(" ") || undefined });
  return <span className={`kv-choice-wrap ${className}`.trim()}><label className={`kv-choice kv-choice--${type}`}><input {...controlProps} type={type} /><span>{label}</span></label>{disabledReason ? <span id={reasonId} className="kv-disabled-reason">{disabledReason}</span> : null}</span>;
}

export function Checkbox(props) { return <Choice {...props} type="checkbox" />; }
export function Radio(props) { return <Choice {...props} type="radio" />; }
export function Switch({ label, ...props }) { return <Choice {...props} label={label} type="checkbox" role="switch" />; }
