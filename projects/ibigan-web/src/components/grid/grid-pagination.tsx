import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  perPageOptions?: number[];
}

export function GridPagination({
  meta,
  onPageChange,
  onPerPageChange,
  perPageOptions = [10, 15, 25, 50],
}: GridPaginationProps) {
  const { t } = useTranslation();
  const from = meta.total === 0 ? 0 : (meta.current_page - 1) * meta.per_page + 1;
  const to = Math.min(meta.current_page * meta.per_page, meta.total);
  const lastPage = Math.max(meta.last_page, 1);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <p className="text-sm text-muted-foreground">
        {t('grid.pagination.range', { from, to, total: meta.total })}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {onPerPageChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t('grid.pagination.per_page')}</span>
            <Select
              value={String(meta.per_page)}
              onValueChange={(value) => onPerPageChange(Number(value))}
            >
              <SelectTrigger className="h-8 w-[72px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {perPageOptions.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          disabled={meta.current_page <= 1}
          onClick={() => onPageChange(meta.current_page - 1)}
        >
          {t('grid.pagination.previous')}
        </Button>
        <span className="flex items-center px-2 text-sm text-muted-foreground">
          {t('grid.pagination.page', { current: meta.current_page, last: lastPage })}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={meta.current_page >= lastPage}
          onClick={() => onPageChange(meta.current_page + 1)}
        >
          {t('grid.pagination.next')}
        </Button>
      </div>
    </div>
  );
}
