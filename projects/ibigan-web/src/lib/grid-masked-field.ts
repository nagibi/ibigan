import { applyMask } from '@/lib/brazilian-masks';
import type { GridColumnFilterMask } from '@/hooks/use-grid-filters';

export function formatGridMaskedCell(
  value?: string | null,
  mask?: GridColumnFilterMask,
  fallback = '—',
): string {
  if (!value?.trim()) return fallback;
  return mask ? applyMask(value, mask) : value;
}
