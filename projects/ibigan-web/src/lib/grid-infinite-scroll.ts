import type { ViewMode } from '@/types/view-mode';
import type { GridPaginationMeta } from '@/components/grid/grid-pagination';
import { isGridPerPageAll, resolveGridPerPageForSlice } from '@/lib/grid-pagination-config';

export function shouldUseGridInfiniteScroll(isMobile: boolean, viewMode: ViewMode) {
  return isMobile && viewMode !== 'table';
}

export function getGridInfiniteHasMore(options: {
  enabled: boolean;
  page: number;
  perPage: number;
  meta?: Pick<GridPaginationMeta, 'current_page' | 'last_page'>;
  clientTotal?: number;
}) {
  if (!options.enabled) return false;

  if (isGridPerPageAll(options.perPage)) {
    return false;
  }

  if (options.meta) {
    return options.meta.current_page < options.meta.last_page;
  }

  if (options.clientTotal != null) {
    return options.page * options.perPage < options.clientTotal;
  }

  return false;
}

export function getClientInfiniteSlice<T>(items: T[], page: number, perPage: number) {
  const effectivePerPage = resolveGridPerPageForSlice(perPage, items.length);
  return items.slice(0, page * effectivePerPage);
}

export function appendGridInfinitePage<T>(previous: T[], pageItems: T[], page: number) {
  return page === 1 ? pageItems : [...previous, ...pageItems];
}
