import type { CSSProperties } from 'react';

export const GRID_DATE_PICKER_ACTIVE_CLASS = 'grid-antd-picker-active';

const activePickerStyle: CSSProperties = {
  borderColor: 'color-mix(in oklab, var(--primary) 60%, transparent)',
  backgroundColor: 'color-mix(in oklab, var(--primary) 5%, transparent)',
};

export function getGridDatePickerActiveStyle(isActive: boolean): CSSProperties | undefined {
  return isActive ? activePickerStyle : undefined;
}
