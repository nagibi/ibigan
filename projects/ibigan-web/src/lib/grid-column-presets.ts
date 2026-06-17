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

const GRID_COLUMN_TYPOGRAPHY_CLASS =
  /\b(text-(?:xs|sm|base|lg|xl|2xl|foreground|muted-foreground|primary|secondary)|font-(?:normal|medium|semibold|bold))\b/g;

function normalizeGridColumnLayoutClass(className?: string): string | undefined {
  if (!className) return undefined;

  const normalized = className
    .replace(GRID_COLUMN_TYPOGRAPHY_CLASS, '')
    .replace(/\s+/g, ' ')
    .trim();

  return normalized || undefined;
}

export const GRID_BODY_CELL_CLASS = 'text-sm font-normal text-muted-foreground [&_*]:font-normal';

export function getGridColumnCellClassName(columnId: string, className?: string): string {
  const resolvedClassName = normalizeGridColumnLayoutClass(
    resolveGridColumnWidthClass(columnId, className),
  );

  return [resolvedClassName, isGridCenteredColumn(columnId) ? 'text-center' : ''].filter(Boolean).join(' ');
}

function resolveGridColumnWidthClass(columnId: string, className?: string): string | undefined {
  if (columnId === 'active' || columnId === 'is_active') {
    if (!className || /\bw-\[80px\]/.test(className)) {
      return (className ?? '').replace(/\bw-\[80px\]/g, '').trim()
        + ' min-w-[100px] w-[100px]'.trim();
    }
  }

  return className;
}

/** @deprecated Headers now use the same width classes as body cells. */
export function toGridColumnMinWidthClassName(className?: string): string | undefined {
  if (!className) return undefined;
  return className.replace(/\bw-\[/g, 'min-w-[');
}
