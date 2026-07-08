import { useMemo } from "react";

export function useAdaptiveData(items, query = "") {
  return useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return items;
    return items.filter((item) => {
      const haystack = [item.name, item.title, item.role, item.department, item.specialty, item.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(trimmed);
    });
  }, [items, query]);
}
