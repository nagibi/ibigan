import i18n from '@/i18n/i18next';

export function resolveGridColumnLabel(columnId: string, label: string): string {
  if (columnId === 'select') return '#';
  if (columnId === 'id') return i18n.t('columns.id');
  if (columnId === 'actions') return i18n.t('columns.actions');
  return label;
}

export function isGridCenteredColumn(columnId: string): boolean {
  return columnId === 'select' || columnId === 'actions';
}

export function getGridColumnCellClassName(columnId: string, className?: string): string {
  return [className, isGridCenteredColumn(columnId) ? 'text-center' : ''].filter(Boolean).join(' ');
}
