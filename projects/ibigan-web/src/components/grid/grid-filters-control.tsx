import { Filter } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { GridFilterBadge } from '@/components/grid/grid-badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { ToolbarTooltip } from '@/components/grid/toolbar-tooltip';

export interface GridActiveFilter {
  id: string;
  label: string;
  value: string;
  onRemove?: () => void;
}

interface GridFiltersControlProps {
  filters: GridActiveFilter[];
  onClearAll?: () => void;
}

export function GridFiltersControl({ filters, onClearAll }: GridFiltersControlProps) {
  const { t } = useTranslation();
  const hasFilters = filters.length > 0;

  return (
    <Popover>
      <ToolbarTooltip content={t('grid.tooltip.filters')}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              'relative h-8 gap-1.5 px-2 text-xs font-medium',
              hasFilters && 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary',
            )}
          >
            <Filter className="size-3.5 shrink-0" />
            {t('grid.filters')}
            {hasFilters && (
              <span className="absolute right-1 top-1 size-1.5 rounded-full bg-primary" />
            )}
          </Button>
        </PopoverTrigger>
      </ToolbarTooltip>
      <PopoverContent align="start" className="w-72 p-3">
        <p className="mb-3 text-sm font-medium">{t('grid.filters_applied')}</p>

        {hasFilters ? (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <GridFilterBadge
                  key={filter.id}
                  variant="primary"
                  removeLabel={t('grid.remove_filter', { label: filter.label })}
                  onRemove={filter.onRemove}
                  className="max-w-full"
                >
                  <span className="truncate">
                    <span className="text-muted-foreground">{filter.label}:</span>{' '}
                    {filter.value}
                  </span>
                </GridFilterBadge>
              ))}
            </div>

            {onClearAll && (
              <ToolbarTooltip
                content={t('grid.tooltip.clear_filters')}
                className="mt-1 flex w-full"
              >
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 w-full justify-center px-2"
                  onClick={onClearAll}
                >
                  {t('grid.clear_filters')}
                </Button>
              </ToolbarTooltip>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t('grid.no_filters')}</p>
        )}
      </PopoverContent>
    </Popover>
  );
}
