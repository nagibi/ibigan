import { useCallback, useState } from 'react';

export interface UseGridStringSelectionOptions {
  onActivate?: (selectedIds: string[]) => void | Promise<void>;
  onDeactivate?: (selectedIds: string[]) => void | Promise<void>;
}

export function useGridStringSelection({
  onActivate,
  onDeactivate,
}: UseGridStringSelectionOptions = {}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [selectionAnchor, setSelectionAnchor] = useState<string | null>(null);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  const [isTogglingActive, setIsTogglingActive] = useState(false);

  const toggleSelect = useCallback((id: string) => {
    setSelectionAnchor(id);
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }, []);

  const selectRow = useCallback(
    (id: string, options?: { shift?: boolean; rangeOrder?: string[] }) => {
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

  const toggleSelectAll = useCallback((ids: string[]) => {
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

  const requestDelete = useCallback((ids: string[]) => {
    const uniqueIds = [...new Set(ids)];
    if (uniqueIds.length > 0) {
      setDeleteIds(uniqueIds);
    }
  }, []);

  const clearDeleteRequest = useCallback(() => setDeleteIds([]), []);

  const runBulkToggle = useCallback(
    async (handler?: (selectedIds: string[]) => void | Promise<void>) => {
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

  return {
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
