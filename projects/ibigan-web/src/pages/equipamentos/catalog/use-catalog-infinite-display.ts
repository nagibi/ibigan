import { useEffect } from 'react';
import { useGridInfiniteScroll } from '@/hooks/use-grid-infinite-scroll';
import type { useGrid } from '@/hooks/use-grid';
import type { useGridFilters } from '@/hooks/use-grid-filters';
import type { CatalogPaginationMeta } from '@/types/equipamento-catalog';

type GridState = ReturnType<typeof useGrid>;
type ColumnFiltersState = ReturnType<typeof useGridFilters>;

export function useCatalogInfiniteDisplay<T>({
  items,
  meta,
  isLoading,
  infiniteScrollEnabled,
  grid,
  columnFilters,
}: {
  items: T[];
  meta?: CatalogPaginationMeta;
  isLoading: boolean;
  infiniteScrollEnabled: boolean;
  grid: GridState;
  columnFilters: ColumnFiltersState;
}) {
  const resolvedMeta = meta ?? {
    current_page: grid.page,
    last_page: 1,
    per_page: grid.perPage,
    total: items.length,
  };

  const infiniteScroll = useGridInfiniteScroll<T>({
    enabled: infiniteScrollEnabled,
    page: grid.page,
    setPage: grid.setPage,
    loading: isLoading,
    perPage: grid.perPage,
    meta: resolvedMeta,
    resetDeps: [
      grid.debouncedSearch,
      grid.sort,
      grid.sortDir,
      columnFilters.activeFilterParams,
      infiniteScrollEnabled,
    ],
  });

  useEffect(() => {
    infiniteScroll.receivePage(items, grid.page);
  }, [grid.page, infiniteScroll.receivePage, items]);

  const displayItems = infiniteScrollEnabled ? infiniteScroll.items : items;

  return {
    displayItems,
    infiniteScroll,
    resolvedMeta,
  };
}
