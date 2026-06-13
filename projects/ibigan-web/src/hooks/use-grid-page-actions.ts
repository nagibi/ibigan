import { useCallback } from 'react';
import { useGridToasts } from '@/hooks/use-grid-toasts';

type UseGridPageActionsOptions = {
  resetColumns: () => void;
  clearAllFilters: () => void;
  clearSearch?: () => void;
  resetSettings?: () => void;
};

export function useGridPageActions({
  resetColumns,
  clearAllFilters,
  clearSearch,
  resetSettings,
}: UseGridPageActionsOptions) {
  const gridToasts = useGridToasts();

  const handleResetColumns = useCallback(() => {
    resetColumns();
    gridToasts.columnsRestored();
  }, [gridToasts, resetColumns]);

  const handleClearFilters = useCallback(() => {
    clearSearch?.();
    clearAllFilters();
    gridToasts.filtersCleared();
  }, [clearAllFilters, clearSearch, gridToasts]);

  const handleResetGrid = useCallback(() => {
    resetColumns();
    clearSearch?.();
    clearAllFilters();
    resetSettings?.();
    gridToasts.gridRestored();
  }, [clearAllFilters, clearSearch, gridToasts, resetColumns, resetSettings]);

  return {
    handleResetColumns,
    handleClearFilters,
    handleResetGrid,
    exportSoon: gridToasts.exportSoon,
  };
}
