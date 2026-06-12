import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

export function useGridToasts() {
  const { t } = useTranslation();

  const columnsRestored = useCallback(
    () => toast.success(t('grid.columns_restored_toast')),
    [t],
  );
  const filtersCleared = useCallback(
    () => toast.success(t('grid.filters_cleared_toast')),
    [t],
  );
  const gridRestored = useCallback(
    () => toast.success(t('grid.restored_toast')),
    [t],
  );
  const exportSoon = useCallback(
    () => toast.info(t('common.export_soon')),
    [t],
  );

  return {
    columnsRestored,
    filtersCleared,
    gridRestored,
    exportSoon,
  };
}
