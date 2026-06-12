import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import type { GridColumnFilterDef } from '@/hooks/use-grid-filters';
import { parseMultiFilterValue } from '@/components/grid/grid-multi-value-filter';
import { GridDateRangeFilter } from '@/components/grid/grid-date-range-filter';
import { GridMultiValueFilter } from '@/components/grid/grid-multi-value-filter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface GridColumnFilterProps {
  filter: GridColumnFilterDef;
  value: string;
  onChange: (value: string) => void;
  dateRangeFrom?: string;
  dateRangeTo?: string;
  onDateRangeChange?: (from: string, to: string) => void;
  onClear?: () => void;
}

function isFilterActive(
  filter: GridColumnFilterDef,
  value: string,
  dateRangeFrom: string,
  dateRangeTo: string,
) {
  if (filter.type === 'dateRange') {
    return Boolean(dateRangeFrom.trim() || dateRangeTo.trim());
  }

  if (filter.type === 'multi') {
    return parseMultiFilterValue(value).length > 0;
  }

  return value.trim().length > 0;
}

export function GridColumnFilter({
  filter,
  value,
  onChange,
  dateRangeFrom = '',
  dateRangeTo = '',
  onDateRangeChange,
  onClear,
}: GridColumnFilterProps) {
  const isActive = isFilterActive(filter, value, dateRangeFrom, dateRangeTo);
  const inputClassName = cn(
    'h-7 w-full min-w-[72px] text-xs',
    isActive && 'border-primary/60 bg-primary/5',
  );

  let control: ReactNode;

  if (filter.type === 'select') {
    control = (
      <Select value={value || '__all__'} onValueChange={(v) => onChange(v === '__all__' ? '' : v)}>
        <SelectTrigger className={inputClassName}>
          <SelectValue placeholder={filter.placeholder ?? 'Todos'} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{filter.placeholder ?? 'Todos'}</SelectItem>
          {filter.options?.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  } else if (filter.type === 'multi') {
    control = (
      <GridMultiValueFilter
        value={value}
        onChange={onChange}
        placeholder={filter.placeholder ?? 'Adicionar...'}
        inputMode={filter.inputMode}
      />
    );
  } else if (filter.type === 'dateRange') {
    control = (
      <GridDateRangeFilter
        from={dateRangeFrom}
        to={dateRangeTo}
        onChange={(from, to) => onDateRangeChange?.(from, to)}
        placeholder={filter.placeholder ?? 'Período'}
      />
    );
  } else if (filter.type === 'date') {
    control = (
      <Input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClassName}
      />
    );
  } else {
    control = (
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={filter.placeholder ?? 'Filtrar...'}
        className={inputClassName}
      />
    );
  }

  return (
    <div className="flex items-center gap-0.5">
      <div className="min-w-0 flex-1">{control}</div>
      {isActive && onClear && (
        <Button
          type="button"
          variant="ghost"
          mode="icon"
          size="sm"
          className="size-6 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={onClear}
          title="Limpar filtro"
        >
          <X className="size-3" />
        </Button>
      )}
    </div>
  );
}
