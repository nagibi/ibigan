import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  GRID_DEFAULT_PER_PAGE_OPTIONS,
  GRID_PER_PAGE_ALL_VALUE,
  getEffectiveGridPerPage,
  getGridPerPageSelectValue,
  parseGridPerPageSelectValue,
} from '@/lib/grid-pagination-config';

export interface GridPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface GridPaginationProps {
  meta: GridPaginationMeta;
  onPageChange: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  /** Selected page size (may be GRID_PER_PAGE_ALL). Falls back to meta.per_page. */
  perPage?: number;
  perPageOptions?: number[];
  showAllOption?: boolean;
}

export function GridPagination({
  meta,
  onPageChange,
  onPerPageChange,
  perPage,
  perPageOptions = [...GRID_DEFAULT_PER_PAGE_OPTIONS],
  showAllOption = true,
}: GridPaginationProps) {
  const { t } = useTranslation();
  const selectedPerPage = perPage ?? meta.per_page;
  const effectivePerPage = getEffectiveGridPerPage(selectedPerPage, meta.total);
  const from = meta.total === 0 ? 0 : (meta.current_page - 1) * effectivePerPage + 1;
  const to = Math.min(meta.current_page * effectivePerPage, meta.total);
  const lastPage = Math.max(meta.last_page, 1);

  return (
    <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <p className="hidden shrink-0 text-sm text-muted-foreground xl:block">
        {t('grid.pagination.range', { from, to, total: meta.total })}
      </p>

      <div className="flex items-center justify-between gap-2 sm:justify-end sm:gap-4">
        {onPerPageChange ? (
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {t('grid.pagination.per_page')}
            </span>
            <Select
              value={getGridPerPageSelectValue(selectedPerPage)}
              onValueChange={(value) => onPerPageChange(parseGridPerPageSelectValue(value))}
            >
              <SelectTrigger
                className="h-8 w-auto min-w-[4.5rem] px-2 sm:min-w-[72px]"
                aria-label={t('grid.pagination.per_page')}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {perPageOptions.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
                {showAllOption ? (
                  <SelectItem value={GRID_PER_PAGE_ALL_VALUE}>
                    {t('grid.pagination.all')}
                  </SelectItem>
                ) : null}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2 sm:px-3"
            disabled={meta.current_page <= 1}
            onClick={() => onPageChange(meta.current_page - 1)}
            aria-label={t('grid.pagination.previous')}
          >
            <ChevronLeft className="size-4 sm:hidden" />
            <span className="hidden sm:inline">{t('grid.pagination.previous')}</span>
          </Button>
          <span className="min-w-[2.75rem] px-1 text-center text-xs text-muted-foreground whitespace-nowrap sm:min-w-0 sm:px-2 sm:text-sm">
            <span className="sm:hidden">
              {meta.current_page}/{lastPage}
            </span>
            <span className="hidden sm:inline">
              {t('grid.pagination.page', { current: meta.current_page, last: lastPage })}
            </span>
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2 sm:px-3"
            disabled={meta.current_page >= lastPage}
            onClick={() => onPageChange(meta.current_page + 1)}
            aria-label={t('grid.pagination.next')}
          >
            <ChevronRight className="size-4 sm:hidden" />
            <span className="hidden sm:inline">{t('grid.pagination.next')}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
