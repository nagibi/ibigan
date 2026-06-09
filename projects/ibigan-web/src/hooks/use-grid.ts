import { useCallback, useMemo, useState } from 'react';
import { useDebounce } from '@/hooks/use-debounce';

export type SortDirection = 'asc' | 'desc';

export interface UseGridOptions {
  defaultPage?: number;
  defaultPerPage?: number;
  defaultSort?: string | null;
  defaultSortDir?: SortDirection;
  onActivate?: (selectedIds: number[]) => void | Promise<void>;
  onDeactivate?: (selectedIds: number[]) => void | Promise<void>;
}

export function useGrid({
  defaultPage = 1,
  defaultPerPage = 15,
  defaultSort = null,
  defaultSortDir = 'asc',
  onActivate,
  onDeactivate,
}: UseGridOptions = {}) {
  const [page, setPage] = useState(defaultPage);
  const [perPage, setPerPageState] = useState(defaultPerPage);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<string | null>(defaultSort);
  const [sortDir, setSortDir] = useState<SortDirection>(defaultSortDir);
  const [selected, setSelected] = useState<number[]>([]);
  const [selectionAnchor, setSelectionAnchor] = useState<number | null>(null);
  const [deleteIds, setDeleteIds] = useState<number[]>([]);
  const [isTogglingActive, setIsTogglingActive] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  const toggleSelect = useCallback((id: number) => {
    setSelectionAnchor(id);
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  }, []);

  const selectRow = useCallback(
    (id: number, options?: { shift?: boolean; rangeOrder?: number[] }) => {
      if (options?.shift && selectionAnchor !== null && options.rangeOrder) {
        const anchorIndex = options.rangeOrder.indexOf(selectionAnchor);
        const targetIndex = options.rangeOrder.indexOf(id);

        if (anchorIndex >= 0 && targetIndex >= 0) {
          const start = Math.min(anchorIndex, targetIndex);
          const end = Math.max(anchorIndex, targetIndex);
          setSelected(options.rangeOrder.slice(start, end + 1));
          return;
        }
      }

      setSelected((prev) => {
        if (prev.includes(id)) {
          const next = prev.filter((item) => item !== id);
          setSelectionAnchor(
            selectionAnchor !== null && next.includes(selectionAnchor)
              ? selectionAnchor
              : (next[next.length - 1] ?? null),
          );
          return next;
        }

        setSelectionAnchor(id);
        return [...prev, id];
      });
    },
    [selectionAnchor],
  );

  const toggleSelectAll = useCallback((ids: number[]) => {
    setSelected((prev) => {
      if (prev.length === ids.length) {
        setSelectionAnchor(null);
        return [];
      }

      setSelectionAnchor(ids[0] ?? null);
      return ids;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelected([]);
    setSelectionAnchor(null);
  }, []);

  const requestDelete = useCallback((ids: number[]) => {
    const uniqueIds = [...new Set(ids)];
    if (uniqueIds.length > 0) {
      setDeleteIds(uniqueIds);
    }
  }, []);

  const clearDeleteRequest = useCallback(() => setDeleteIds([]), []);

  const runBulkToggle = useCallback(
    async (handler?: (selectedIds: number[]) => void | Promise<void>) => {
      if (selected.length === 0 || !handler) return;

      try {
        setIsTogglingActive(true);
        await handler(selected);
        clearSelection();
      } finally {
        setIsTogglingActive(false);
      }
    },
    [clearSelection, selected],
  );

  const activateSelected = useCallback(
    () => runBulkToggle(onActivate),
    [onActivate, runBulkToggle],
  );

  const deactivateSelected = useCallback(
    () => runBulkToggle(onDeactivate),
    [onDeactivate, runBulkToggle],
  );

  const handleSearch = useCallback((v: string) => {
    setSearch(v);
    setPage(1);
  }, []);

  const clearSearch = useCallback(() => {
    setSearch('');
    setPage(1);
  }, []);

  const setPerPage = useCallback((value: number) => {
    setPerPageState(value);
    setPage(1);
  }, []);

  const toggleSort = useCallback((column: string) => {
    setPage(1);

    if (sort === column) {
      setSortDir((direction) => (direction === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSort(column);
    setSortDir('asc');
  }, [sort]);

  const resetSettings = useCallback(() => {
    setPage(defaultPage);
    setPerPageState(defaultPerPage);
    setSort(defaultSort);
    setSortDir(defaultSortDir);
  }, [defaultPage, defaultPerPage, defaultSort, defaultSortDir]);

  const isCustomized = useMemo(
    () =>
      perPage !== defaultPerPage ||
      sort !== defaultSort ||
      (sort !== null && sortDir !== defaultSortDir),
    [defaultPerPage, defaultSort, defaultSortDir, perPage, sort, sortDir],
  );

  const hasFilters = useMemo(() => search.trim().length > 0, [search]);

  return {
    page,
    setPage,
    perPage,
    setPerPage,
    search,
    setSearch: handleSearch,
    clearSearch,
    debouncedSearch,
    hasFilters,
    sort,
    sortDir,
    toggleSort,
    resetSettings,
    isCustomized,
    selected,
    toggleSelect,
    selectRow,
    toggleSelectAll,
    clearSelection,
    hasSelection: selected.length > 0,
    singleSelection: selected.length === 1,
    isAllSelected: (total: number) => total > 0 && selected.length === total,
    deleteIds,
    requestDelete,
    clearDeleteRequest,
    isTogglingActive,
    activateSelected,
    deactivateSelected,
  };
}
