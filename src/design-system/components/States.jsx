import React from "react";
import { Button } from "./Button.jsx";

function StateLayout({ kind, title, message, actionLabel, onAction, children, role }) {
  return <section className={`kv-state kv-state--${kind}`} role={role}><div className="kv-state__icon" aria-hidden="true">{children}</div><h2>{title}</h2>{message ? <p>{message}</p> : null}{actionLabel && onAction ? <Button variant="secondary" onClick={onAction}>{actionLabel}</Button> : null}</section>;
}

export function EmptyState({ title, message, actionLabel, onAction }) {
  return <StateLayout kind="empty" title={title} message={message} actionLabel={actionLabel} onAction={onAction}>○</StateLayout>;
}

export function ErrorState({ title, message, actionLabel, onAction }) {
  return <StateLayout kind="error" title={title} message={message} actionLabel={actionLabel} onAction={onAction} role="alert">!</StateLayout>;
}

export function LoadingState({ label = "読み込み中" }) {
  return <div className="kv-loading" role="status" aria-live="polite"><span className="kv-loading__spinner" aria-hidden="true" /><span>{label}</span></div>;
}

export function Skeleton({ width = "100%", height = "1em", radius = "md", className = "" }) {
  return <span className={`kv-skeleton kv-skeleton--${radius} ${className}`.trim()} style={{ width, height }} aria-hidden="true" />;
}

export function SkeletonGroup({ count = 3, label = "読み込み中" }) {
  const safeCount = Math.max(1, Math.min(20, Number(count) || 1));
  return <div className="kv-skeleton-group" role="status" aria-label={label}>{Array.from({ length: safeCount }, (_, index) => <Skeleton key={index} />)}</div>;
}
