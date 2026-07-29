import React from "react";
import { EmptyState, LoadingState } from "./States.jsx";

export function Table({ caption, columns, rows, rowKey = "id", loading = false, emptyTitle = "No records", emptyMessage, sort, onSort, className = "" }) {
  if (loading) return <LoadingState />;
  if (!rows?.length) return <EmptyState title={emptyTitle} message={emptyMessage} />;
  return <div className={`kv-table-scroll ${className}`.trim()}><table className="kv-table"><caption className="sr-only">{caption}</caption><thead><tr>{columns.map((column) => <th key={column.key} scope="col" aria-sort={sort?.key === column.key ? sort.direction : undefined}>{column.sortable && onSort ? <button type="button" onClick={() => onSort(column.key)}>{column.label}</button> : column.label}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={typeof rowKey === "function" ? rowKey(row, index) : row[rowKey] ?? index}>{columns.map((column) => <td key={column.key} data-label={column.label}>{column.render ? column.render(row) : row[column.key]}</td>)}</tr>)}</tbody></table></div>;
}
