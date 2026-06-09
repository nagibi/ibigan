import { useCallback, useMemo, useState } from 'react';
import { useDebounce } from '@/hooks/use-debounce';

export type GridColumnFilterType = 'text' | 'select' | 'date' | 'dateRange' | 'multi';

export function dateRangeFilterFromKey(key: string) {
  return `${key}_from`;
}

export function dateRangeFilterToKey(key: string) {
  return `${key}_to`;
}

export type GridColumnFilterInputMode = 'text' | 'numeric';

export interface GridColumnFilterOption {
  label: string;
  value: string;
}

export interface GridColumnFilterDef {
  type: GridColumnFilterType;
  filterKey: string;
  placeholder?: string;
  options?: GridColumnFilterOption[];
  inputMode?: GridColumnFilterInputMode;
}

export function useGridFilters(onFilterChange?: () => void) {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const debouncedFilters = useDebounce(filters, 400);

  const setFilter = useCallback(
    (key: string, value: string) => {
      setFilters((prev) => {
        if (!value) {
          const next = { ...prev };
          delete next[key];
          return next;
        }
        return { ...prev, [key]: value };
      });
      onFilterChange?.();
    },
    [onFilterChange],
  );

  const clearFilter = useCallback(
    (key: string) => {
      setFilters((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      onFilterChange?.();
    },
    [onFilterChange],
  );

  const clearAllFilters = useCallback(() => {
    setFilters({});
    onFilterChange?.();
  }, [onFilterChange]);

  const setDateRangeFilter = useCallback(
    (key: string, from: string, to: string) => {
      setFilters((prev) => {
        const next = { ...prev };
        const fromKey = dateRangeFilterFromKey(key);
        const toKey = dateRangeFilterToKey(key);

        if (from) next[fromKey] = from;
        else delete next[fromKey];

        if (to) next[toKey] = to;
        else delete next[toKey];

        return next;
      });
      onFilterChange?.();
    },
    [onFilterChange],
  );

  const clearDateRangeFilter = useCallback(
    (key: string) => {
      setFilters((prev) => {
        const next = { ...prev };
        delete next[dateRangeFilterFromKey(key)];
        delete next[dateRangeFilterToKey(key)];
        return next;
      });
      onFilterChange?.();
    },
    [onFilterChange],
  );

  const hasFilters = useMemo(
    () => Object.values(filters).some((value) => value.trim().length > 0),
    [filters],
  );

  const activeFilterParams = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(debouncedFilters).filter(([, value]) => value.trim().length > 0),
      ),
    [debouncedFilters],
  );

  return {
    filters,
    debouncedFilters,
    activeFilterParams,
    setFilter,
    clearFilter,
    clearAllFilters,
    setDateRangeFilter,
    clearDateRangeFilter,
    hasFilters,
  };
}
