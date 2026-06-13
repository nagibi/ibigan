import { useCallback, useRef, type MouseEvent } from 'react';

export const GRID_ROW_INTERACTIVE_SELECTOR =
  'button, a, input, textarea, select, label, [role="switch"], [role="checkbox"], [data-grid-no-row-select]';

export const GRID_ROW_DOUBLE_CLICK_MS = 400;

export function isGridRowInteractiveTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest(GRID_ROW_INTERACTIVE_SELECTOR));
}

type GridRowPointerEvent = Pick<MouseEvent<HTMLElement>, 'target' | 'shiftKey'>;

export function useGridRowClickHandler<T>({
  getRowKey,
  onRowClick,
  onRowDoubleClick,
}: {
  getRowKey: (row: T) => string | number;
  onRowClick?: (row: T, event: MouseEvent<HTMLElement>) => void;
  onRowDoubleClick?: (row: T, event: MouseEvent<HTMLElement>) => void;
}) {
  const lastClickRef = useRef<{ rowKey: string | number; time: number } | null>(null);

  return useCallback(
    (row: T, event: GridRowPointerEvent) => {
      if (isGridRowInteractiveTarget(event.target)) return;
      if (!onRowClick && !onRowDoubleClick) return;

      const rowKey = getRowKey(row);
      const now = Date.now();
      const lastClick = lastClickRef.current;

      if (
        onRowDoubleClick
        && lastClick
        && lastClick.rowKey === rowKey
        && now - lastClick.time <= GRID_ROW_DOUBLE_CLICK_MS
      ) {
        lastClickRef.current = null;
        onRowDoubleClick(row, event as MouseEvent<HTMLElement>);
        return;
      }

      lastClickRef.current = { rowKey, time: now };
      onRowClick?.(row, event as MouseEvent<HTMLElement>);
    },
    [getRowKey, onRowClick, onRowDoubleClick],
  );
}
