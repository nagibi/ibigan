/** Sentinel value: show all records on one page. */
export const GRID_PER_PAGE_ALL = -1;

export const GRID_PER_PAGE_ALL_VALUE = 'all';

export const GRID_DEFAULT_PER_PAGE_OPTIONS = [5, 10, 15, 25, 50] as const;

/** Fallback when total is unknown yet (e.g. first request with "Todos"). */
export const GRID_PER_PAGE_ALL_FALLBACK = 9999;

export function isGridPerPageAll(perPage: number): boolean {
  return perPage === GRID_PER_PAGE_ALL;
}

export function resolveGridPerPage(perPage: number, total = 0): number {
  if (isGridPerPageAll(perPage)) {
    return total > 0 ? total : GRID_PER_PAGE_ALL_FALLBACK;
  }

  return perPage;
}

export function resolveGridPerPageForSlice(perPage: number, itemCount: number): number {
  if (isGridPerPageAll(perPage)) {
    return Math.max(itemCount, 1);
  }

  return perPage;
}

export function getGridPerPageSelectValue(perPage: number): string {
  return isGridPerPageAll(perPage) ? GRID_PER_PAGE_ALL_VALUE : String(perPage);
}

export function parseGridPerPageSelectValue(value: string): number {
  return value === GRID_PER_PAGE_ALL_VALUE ? GRID_PER_PAGE_ALL : Number(value);
}

export function getEffectiveGridPerPage(perPage: number, total: number): number {
  return isGridPerPageAll(perPage) ? total : perPage;
}
