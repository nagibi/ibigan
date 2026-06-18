import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  dateRangeFilterFromKey,
  dateRangeFilterToKey,
  type GridColumnFilterDef,
} from '@/hooks/use-grid-filters';
import type { GridColumnDef } from '@/hooks/use-grid-columns';
import { GridFilterBadge } from '@/components/grid/grid-badge';
import { GridColumnFilter } from '@/components/grid/grid-column-filter';
import { ClearFiltersButton, type GridActiveFilter } from '@/components/grid/grid-filters-control';

export type GridColumnFilterColumn = Pick<
  GridColumnDef<unknown>,
  'id' | 'label' | 'filter'
>;

export interface GridColumnFiltersConfig {
  columns: GridColumnFilterColumn[];
  values: Record<string, string>;
  onFilterChange: (filterKey: string, value: string) => void;
  onDateRangeChange: (filterKey: string, from: string, to: string) => void;
  onFilterClear: (filter: GridColumnFilterDef) => void;
}

interface GridColumnFiltersPanelProps {
  columnFilters: GridColumnFiltersConfig;
  appliedFilters?: GridActiveFilter[];
  onClearAll?: () => void;
  showAppliedClearAll?: boolean;
}

export function GridColumnFiltersPanel({
  columnFilters,
  appliedFilters = [],
  onClearAll,
  showAppliedClearAll = true,
}: GridColumnFiltersPanelProps) {
  const { t } = useTranslation();

  const filterableColumns = useMemo(
    () => columnFilters.columns.filter((column) => column.filter),
    [columnFilters.columns],
  );

  if (filterableColumns.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t('grid.no_column_filters')}</p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {appliedFilters.length > 0 && (
        <section className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t('grid.filters_applied')}
          </p>
          <div className="flex flex-wrap gap-2">
            {appliedFilters.map((filter) => (
              <GridFilterBadge
                key={filter.id}
                variant="primary"
                removeLabel={t('grid.remove_filter', { label: filter.label })}
                onRemove={filter.onRemove}
                className="max-w-full"
              >
                <span className="truncate">
                  <span className="text-muted-foreground">{filter.label}:</span>{' '}
                  {filter.value}
                </span>
              </GridFilterBadge>
            ))}
          </div>
          {showAppliedClearAll && onClearAll && (
            <ClearFiltersButton onClick={onClearAll} className="h-8 w-full" />
          )}
        </section>
      )}

      <section className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t('grid.column_filters')}
        </p>
        <div className="flex flex-col gap-4">
          {filterableColumns.map((column) => {
            const filter = column.filter!;
            return (
              <div key={column.id} className="space-y-1.5">
                <label className="text-sm font-medium leading-none">{column.label}</label>
                <GridColumnFilter
                  filter={filter}
                  value={columnFilters.values[filter.filterKey] ?? ''}
                  onChange={(value) => columnFilters.onFilterChange(filter.filterKey, value)}
                  dateRangeFrom={columnFilters.values[dateRangeFilterFromKey(filter.filterKey)] ?? ''}
                  dateRangeTo={columnFilters.values[dateRangeFilterToKey(filter.filterKey)] ?? ''}
                  onDateRangeChange={(from, to) =>
                    columnFilters.onDateRangeChange(filter.filterKey, from, to)
                  }
                  onClear={() => columnFilters.onFilterClear(filter)}
                  layout="stacked"
                />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
