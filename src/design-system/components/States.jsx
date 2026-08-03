import React from "react";
import { Button } from "./Button.jsx";

function StateLayout({ kind, title, message, reason, available, requirement, actionLabel, onAction, secondaryActionLabel, onSecondaryAction, children, role }) {
  return <section className={`kv-state kv-state--${kind}`} role={role}><div className="kv-state__icon" aria-hidden="true">{children}</div><div className="kv-state__content"><p className="kv-state__label">CURRENT STATE</p><h2>{title}</h2>{message ? <p>{message}</p> : null}{reason ? <p><strong>理由:</strong> {reason}</p> : null}{available ? <p><strong>現在できること:</strong> {available}</p> : null}{requirement ? <p><strong>解放条件:</strong> {requirement}</p> : null}</div>{actionLabel && onAction ? <Button variant="secondary" onClick={onAction}>{actionLabel}</Button> : null}{secondaryActionLabel && onSecondaryAction ? <Button variant="quiet" onClick={onSecondaryAction}>{secondaryActionLabel}</Button> : null}</section>;
}

export function EmptyState({ title, message, actionLabel, onAction }) {
  return <StateLayout kind="empty" title={title} message={message} actionLabel={actionLabel} onAction={onAction}>○</StateLayout>;
}

export function ErrorState({ title, message, actionLabel, onAction }) {
  return <StateLayout kind="error" title={title} message={message} actionLabel={actionLabel} onAction={onAction} role="alert">!</StateLayout>;
}

export function NoMatchState({ title = "条件に一致する項目はありません", message, actionLabel = "条件を解除", onAction }) {
  return <StateLayout kind="no-match" title={title} message={message} actionLabel={actionLabel} onAction={onAction}>⌕</StateLayout>;
}

export function LockedState({ title, message, reason, available, requirement, actionLabel, onAction }) {
  return <StateLayout kind="locked" title={title} message={message} reason={reason} available={available} requirement={requirement} actionLabel={actionLabel} onAction={onAction}>◇</StateLayout>;
}

export function UnavailableState(props) {
  return <StateLayout kind="unavailable" {...props}>—</StateLayout>;
}

export function DataReadiness({ title = "データ準備状況", state = "unknown", current, required, nextAction }) {
  return <section className="kv-data-readiness" aria-label={title}><div><p className="kv-state__label">DATA READINESS</p><h2>{title}</h2></div><dl><div><dt>現在</dt><dd>{current || "不明"}</dd></div><div><dt>必要条件</dt><dd>{required || "不明"}</dd></div><div><dt>次の行動</dt><dd>{nextAction || "現在実行できる操作はありません"}</dd></div></dl><span className={`kv-readiness-dot kv-readiness-dot--${state}`} aria-hidden="true" /></section>;
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
