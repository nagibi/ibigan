import { Filter, X } from 'lucide-react';
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
            {filters.map((filter) => (
              <div
                key={filter.id}
                className="flex items-start justify-between gap-2 rounded-md border border-border px-2.5 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{filter.label}</p>
                  <p className="truncate font-medium">{filter.value}</p>
                </div>
                {filter.onRemove && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    mode="icon"
                    className="size-7 shrink-0"
                    onClick={filter.onRemove}
                    title={`Remover filtro ${filter.label}`}
                  >
                    <X className="size-3.5" />
                  </Button>
                )}
              </div>
            ))}

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
