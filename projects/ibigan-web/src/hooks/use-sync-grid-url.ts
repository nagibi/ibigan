import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { SortDirection } from '@/hooks/use-grid';
import {
  buildGridUrlSearchParams,
  gridUrlSearchParamsAreEqual,
} from '@/lib/grid-url-state';
import type { RolesUserFilter } from '@/lib/roles-user-filter';

interface SyncGridUrlInput {
  page?: number;
  perPage?: number;
  debouncedSearch: string;
  sort?: string | null;
  sortDir?: SortDirection;
  debouncedFilters?: Record<string, string>;
  userFilter?: RolesUserFilter | null;
  syncPagination?: boolean;
  syncSort?: boolean;
  syncColumnFilters?: boolean;
}

export function useSyncGridUrl({
  page,
  perPage,
  debouncedSearch,
  sort,
  sortDir,
  debouncedFilters,
  userFilter,
  syncPagination = true,
  syncSort = true,
  syncColumnFilters = true,
}: SyncGridUrlInput): void {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const next = buildGridUrlSearchParams({
      page: syncPagination ? page : undefined,
      perPage: syncPagination ? perPage : undefined,
      search: debouncedSearch,
      sort: syncSort ? sort : null,
      sortDir: syncSort ? sortDir : 'asc',
      filters: syncColumnFilters ? debouncedFilters : undefined,
      userFilter,
    });

    if (gridUrlSearchParamsAreEqual(searchParams, next)) return;

    setSearchParams(next, { replace: true });
  }, [
    debouncedFilters,
    debouncedSearch,
    page,
    perPage,
    searchParams,
    setSearchParams,
    sort,
    sortDir,
    syncColumnFilters,
    syncPagination,
    syncSort,
    userFilter,
  ]);
}
