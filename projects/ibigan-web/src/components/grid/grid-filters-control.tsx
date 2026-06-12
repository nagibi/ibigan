import { Filter } from 'lucide-react';
import { GridFilterBadge } from '@/components/grid/grid-badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

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
  const hasFilters = filters.length > 0;

  return (
    <Popover>
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
          Filtros
          {hasFilters && (
            <span className="absolute right-1 top-1 size-1.5 rounded-full bg-primary" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-3">
        <p className="mb-3 text-sm font-medium">Filtros aplicados</p>

        {hasFilters ? (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <GridFilterBadge
                  key={filter.id}
                  variant="primary"
                  removeLabel={`Remover filtro ${filter.label}`}
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
              <Button type="button" variant="outline" size="sm" className="mt-1 w-full" onClick={onClearAll}>
                Limpar filtros
              </Button>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum filtro aplicado.</p>
        )}
      </PopoverContent>
    </Popover>
  );
}
