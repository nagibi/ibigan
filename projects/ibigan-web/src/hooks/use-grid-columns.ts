import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { GridColumnFilterDef } from '@/hooks/use-grid-filters';

export interface GridColumnDef<T> {
  id: string;
  label: string;
  sortable?: boolean;
  sortKey?: string;
  pinned?: 'start';
  hideable?: boolean;
  filter?: GridColumnFilterDef;
  className?: string;
  render: (row: T) => ReactNode;
}

interface StoredColumnState {
  order: string[];
  hidden: string[];
}

function loadState(storageKey: string): StoredColumnState | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    return JSON.parse(raw) as StoredColumnState;
  } catch {
    return null;
  }
}

function saveState(storageKey: string, state: StoredColumnState) {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function clearState(storageKey: string) {
  localStorage.removeItem(storageKey);
}

function isOrderCustomized(order: string[], defaultOrder: string[]) {
  if (order.length !== defaultOrder.length) return true;
  return order.some((id, index) => id !== defaultOrder[index]);
}

export function useGridColumns<T>(storageKey: string, definitions: GridColumnDef<T>[]) {
  const defaultOrder = useMemo(
    () => definitions.map((column) => column.id),
    [definitions],
  );

  const [order, setOrder] = useState<string[]>(() => {
    const stored = loadState(storageKey);
    if (!stored?.order?.length) return defaultOrder;

    const validIds = new Set(defaultOrder);
    const storedOrder = stored.order.filter((id) => validIds.has(id));
    const missing = defaultOrder.filter((id) => !storedOrder.includes(id));

    return [...storedOrder, ...missing];
  });

  const [hidden, setHidden] = useState<string[]>(() => {
    const stored = loadState(storageKey);
    if (!stored?.hidden?.length) return [];

    const hideableIds = new Set(
      definitions.filter((column) => column.hideable !== false).map((column) => column.id),
    );

    return stored.hidden.filter((id) => hideableIds.has(id));
  });

  const persist = useCallback(
    (nextOrder: string[], nextHidden: string[]) => {
      saveState(storageKey, { order: nextOrder, hidden: nextHidden });
    },
    [storageKey],
  );

  const setColumnOrder = useCallback(
    (nextOrder: string[]) => {
      setOrder(nextOrder);
      persist(nextOrder, hidden);
    },
    [hidden, persist],
  );

  const toggleColumnVisibility = useCallback(
    (columnId: string) => {
      const column = definitions.find((item) => item.id === columnId);
      if (!column || column.hideable === false || column.pinned) return;

      setHidden((prev) => {
        const next = prev.includes(columnId)
          ? prev.filter((id) => id !== columnId)
          : [...prev, columnId];
        persist(order, next);
        return next;
      });
    },
    [definitions, order, persist],
  );

  const resetColumns = useCallback(() => {
    setOrder(defaultOrder);
    setHidden([]);
    clearState(storageKey);
  }, [defaultOrder, storageKey]);

  const isCustomized = useMemo(
    () => hidden.length > 0 || isOrderCustomized(order, defaultOrder),
    [defaultOrder, hidden, order],
  );

  const reorderDraggableColumns = useCallback(
    (visibleDraggableIds: string[]) => {
      const pinnedIds = definitions
        .filter((column) => column.pinned === 'start')
        .map((column) => column.id);
      const hiddenDraggable = order.filter(
        (id) => hidden.includes(id) && !pinnedIds.includes(id),
      );

      setColumnOrder([...pinnedIds, ...visibleDraggableIds, ...hiddenDraggable]);
    },
    [definitions, hidden, order, setColumnOrder],
  );

  const visibleColumns = useMemo(() => {
    const definitionMap = new Map(definitions.map((column) => [column.id, column]));
    const pinnedStart = definitions.filter((column) => column.pinned === 'start');
    const ordered = order
      .map((id) => definitionMap.get(id))
      .filter((column): column is GridColumnDef<T> => Boolean(column))
      .filter((column) => !column.pinned && !hidden.includes(column.id));

    return [...pinnedStart, ...ordered];
  }, [definitions, hidden, order]);

  const manageableColumns = useMemo(
    () =>
      definitions.filter(
        (column) => column.pinned !== 'start' && column.hideable !== false,
      ),
    [definitions],
  );

  return {
    order,
    hidden,
    visibleColumns,
    manageableColumns,
    setColumnOrder,
    reorderDraggableColumns,
    toggleColumnVisibility,
    resetColumns,
    isCustomized,
    isColumnVisible: (columnId: string) => !hidden.includes(columnId),
  };
}
