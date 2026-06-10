export const GRID_SELECT_COLUMN_LABEL = '#';
export const GRID_ID_COLUMN_LABEL = 'Id';
export const GRID_ACTIONS_COLUMN_LABEL = 'Ações';

export function resolveGridColumnLabel(columnId: string, label: string): string {
  if (columnId === 'select') return GRID_SELECT_COLUMN_LABEL;
  if (columnId === 'id') return GRID_ID_COLUMN_LABEL;
  if (columnId === 'actions') return GRID_ACTIONS_COLUMN_LABEL;
  return label;
}

export function isGridCenteredColumn(columnId: string): boolean {
  return columnId === 'select' || columnId === 'actions';
}

export function getGridColumnCellClassName(columnId: string, className?: string): string {
  return [className, isGridCenteredColumn(columnId) ? 'text-center' : ''].filter(Boolean).join(' ');
}
