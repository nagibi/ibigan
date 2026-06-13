import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { GridColumnDef } from '@/hooks/use-grid-columns';
import { useApiToolbarAlert } from '@/hooks/use-api-toolbar-alert';
import { exportGridToCsv } from '@/lib/grid-export';

type UseGridExportOptions<T> = {
  filename: string;
  columns: GridColumnDef<T>[];
  rows: T[];
};

export function useGridExport<T>({
  filename,
  columns,
  rows,
}: UseGridExportOptions<T>) {
  const { t } = useTranslation();
  const { showSuccess, showError, showInfo } = useApiToolbarAlert();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(() => {
    if (rows.length === 0) {
      showInfo(t('grid.export_empty'));
      return;
    }

    setIsExporting(true);

    try {
      exportGridToCsv({ filename, columns, rows });
      showSuccess(t('grid.export_success'));
    } catch (error) {
      showError(t('grid.export_error'), error);
    } finally {
      setIsExporting(false);
    }
  }, [columns, filename, rows, showError, showInfo, showSuccess, t]);

  return {
    handleExport,
    isExporting,
  };
}
