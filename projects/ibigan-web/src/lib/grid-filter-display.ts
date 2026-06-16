import type { GridColumnFilterDef } from '@/hooks/use-grid-filters';
import { applyMask } from '@/lib/brazilian-masks';
import { parseMultiFilterValue } from '@/components/grid/grid-multi-value-filter';

export function formatSelectFilterDisplayValue(
  value: string,
  options?: GridColumnFilterDef['options'],
): string {
  return parseMultiFilterValue(value)
    .map((item) => options?.find((option) => option.value === item)?.label ?? item)
    .join(', ');
}

export function getColumnFilterDisplayValue(
  filter: GridColumnFilterDef,
  value: string,
): string {
  if (filter.type === 'select') {
    return formatSelectFilterDisplayValue(value, filter.options);
  }

  if (filter.type === 'multi') {
    return parseMultiFilterValue(value).join(', ');
  }

  if (filter.mask) {
    return applyMask(value, filter.mask);
  }

  return value;
}

export function matchesSelectFilterValue(
  fieldValue: string,
  filterValue: string,
): boolean {
  const selected = parseMultiFilterValue(filterValue);
  if (selected.length === 0) return true;
  return selected.includes(fieldValue);
}
