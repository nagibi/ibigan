import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GridPaginationMeta } from '@/components/grid/grid-pagination';
import { appendGridInfinitePage, getClientInfiniteSlice, getGridInfiniteHasMore } from '@/lib/grid-infinite-scroll';

export function useGridInfiniteScroll<T>({
  enabled,
  page,
  setPage,
  loading,
  perPage,
  meta,
  clientTotal,
  resetDeps = [],
}: {
  enabled: boolean;
  page: number;
  setPage: (value: number | ((prev: number) => number)) => void;
  loading: boolean;
  perPage: number;
  meta?: Pick<GridPaginationMeta, 'current_page' | 'last_page' | 'total'>;
  clientTotal?: number;
  resetDeps?: unknown[];
}) {
  const [items, setItems] = useState<T[]>([]);
  const resetSignature = useMemo(() => JSON.stringify(resetDeps), [resetDeps]);
  const previousResetSignature = useRef(resetSignature);

  useEffect(() => {
    if (previousResetSignature.current === resetSignature) return;
    previousResetSignature.current = resetSignature;
    setItems([]);
    if (page !== 1) {
      setPage(1);
    }
  }, [page, resetSignature, setPage]);

  useEffect(() => {
    if (!enabled) {
      setItems([]);
    }
  }, [enabled]);

  const receivePage = useCallback(
    (pageItems: T[], currentPage: number) => {
      if (!enabled) return;
      setItems((previous) => appendGridInfinitePage(previous, pageItems, currentPage));
    },
    [enabled],
  );

  const resetItems = useCallback(() => setItems([]), []);

  const hasMore = getGridInfiniteHasMore({
    enabled,
    page,
    perPage,
    meta,
    clientTotal,
  });

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    setPage((current) => current + 1);
  }, [hasMore, loading, setPage]);

  const loadingMore = enabled && loading && page > 1;
  const total = meta?.total ?? clientTotal ?? items.length;
  const loadedCount = items.length;

  return {
    items,
    receivePage,
    resetItems,
    hasMore,
    loadMore,
    loadingMore,
    loadedCount,
    total,
  };
}

export function useClientGridInfiniteScroll<T>({
  items,
  page,
  perPage,
  setPage,
  enabled,
  resetDeps = [],
}: {
  items: T[];
  page: number;
  perPage: number;
  setPage: (value: number | ((prev: number) => number)) => void;
  enabled: boolean;
  resetDeps?: unknown[];
}) {
  const resetSignature = useMemo(() => JSON.stringify(resetDeps), [resetDeps]);
  const previousResetSignature = useRef(resetSignature);

  useEffect(() => {
    if (previousResetSignature.current === resetSignature) return;
    previousResetSignature.current = resetSignature;
    if (page !== 1) {
      setPage(1);
    }
  }, [page, resetSignature, setPage]);

  const displayItems = useMemo(
    () => (enabled
      ? getClientInfiniteSlice(items, page, perPage)
      : items.slice((page - 1) * perPage, page * perPage)),
    [enabled, items, page, perPage],
  );

  const hasMore = getGridInfiniteHasMore({
    enabled,
    page,
    perPage,
    clientTotal: items.length,
  });

  const loadMore = useCallback(() => {
    if (hasMore) {
      setPage((current) => current + 1);
    }
  }, [hasMore, setPage]);

  return {
    displayItems,
    hasMore,
    loadMore,
    loadedCount: displayItems.length,
    total: items.length,
  };
}
