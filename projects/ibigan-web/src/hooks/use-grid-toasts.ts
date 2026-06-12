import { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { toolbarAlertStore } from '@/stores/toolbar-alert-store';

export function useGridToasts() {
  const { t } = useTranslation();
  const alertId = useRef(0);

  const columnsRestored = useCallback(
    () => toast.success(t('grid.columns_restored_toast')),
    [t],
  );

  const filtersCleared = useCallback(() => {
    alertId.current += 1;
    toolbarAlertStore.show({
      variant: 'success',
      title: t('grid.filters_cleared_toast'),
      id: alertId.current,
    });
  }, [t]);

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
