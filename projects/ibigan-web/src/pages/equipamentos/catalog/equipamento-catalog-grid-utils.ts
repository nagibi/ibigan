import type { GridColumnDef } from '@/hooks/use-grid-columns';
import {
  dateRangeFilterFromKey,
  dateRangeFilterToKey,
} from '@/hooks/use-grid-filters';
import { formatDateRangeFilterLabel } from '@/components/grid/grid-date-range-filter';
import type { GridActiveFilter } from '@/components/grid/grid-filters-control';
import { getColumnFilterDisplayValue } from '@/lib/grid-filter-display';

type BuildCatalogActiveFiltersInput<T> = {
  columnDefinitions: GridColumnDef<T>[];
  columnFilters: {
    filters: Record<string, string>;
    clearFilter: (key: string) => void;
    clearDateRangeFilter: (key: string) => void;
  };
  search: string;
  clearSearch: () => void;
};

export function buildCatalogActiveFilters<T>({
  columnDefinitions,
  columnFilters,
  search,
  clearSearch,
}: BuildCatalogActiveFiltersInput<T>): GridActiveFilter[] {
  const items: GridActiveFilter[] = [];

  if (search.trim()) {
    items.push({
      id: 'search',
      label: 'Busca',
      value: search.trim(),
      onRemove: clearSearch,
    });
  }

  for (const column of columnDefinitions) {
    if (!column.filter) continue;

    if (column.filter.type === 'dateRange') {
      const from =
        columnFilters.filters[dateRangeFilterFromKey(column.filter.filterKey)]?.trim() ?? '';
      const to =
        columnFilters.filters[dateRangeFilterToKey(column.filter.filterKey)]?.trim() ?? '';
      if (!from && !to) continue;

      items.push({
        id: column.filter.filterKey,
        label: column.label,
        value: formatDateRangeFilterLabel(from, to),
        onRemove: () => columnFilters.clearDateRangeFilter(column.filter!.filterKey),
      });
      continue;
    }

    const value = columnFilters.filters[column.filter.filterKey]?.trim();
    if (!value) continue;

    items.push({
      id: column.filter.filterKey,
      label: column.label,
      value: getColumnFilterDisplayValue(column.filter, value),
      onRemove: () => columnFilters.clearFilter(column.filter!.filterKey),
    });
  }

  return items;
}

export function buildCatalogActiveFilterOptions() {
  return [
    { label: 'Ativo', value: '1' },
    { label: 'Inativo', value: '0' },
  ];
}
