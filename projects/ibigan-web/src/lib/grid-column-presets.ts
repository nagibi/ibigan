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

/** Use min-width on headers so sort/drag controls are not clipped when the table stretches to 100%. */
export function toGridColumnMinWidthClassName(className?: string): string | undefined {
  if (!className) return undefined;
  return className.replace(/\bw-\[/g, 'min-w-[');
}
