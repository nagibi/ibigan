import { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toolbarAlertStore } from '@/stores/toolbar-alert-store';

export function useGridToasts() {
  const { t } = useTranslation();
  const alertId = useRef(0);

  const showAlert = useCallback((variant: 'success' | 'info', title: string) => {
    alertId.current += 1;
    toolbarAlertStore.show({
      variant,
      title,
      id: alertId.current,
    });
  }, []);

  const columnsRestored = useCallback(
    () => showAlert('success', t('grid.columns_restored_toast')),
    [showAlert, t],
  );

  const filtersCleared = useCallback(
    () => showAlert('success', t('grid.filters_cleared_toast')),
    [showAlert, t],
  );

  const gridRestored = useCallback(
    () => showAlert('success', t('grid.restored_toast')),
    [showAlert, t],
  );

  const exportSoon = useCallback(
    () => showAlert('info', t('common.export_soon')),
    [showAlert, t],
  );

  return {
    columnsRestored,
    filtersCleared,
    gridRestored,
    exportSoon,
  };
}
