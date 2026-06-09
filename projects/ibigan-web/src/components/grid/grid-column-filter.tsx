import type { GridColumnFilterDef } from '@/hooks/use-grid-filters';
import { GridDateRangeFilter } from '@/components/grid/grid-date-range-filter';
import { GridMultiValueFilter } from '@/components/grid/grid-multi-value-filter';
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
}

export function GridColumnFilter({
  filter,
  value,
  onChange,
  dateRangeFrom = '',
  dateRangeTo = '',
  onDateRangeChange,
}: GridColumnFilterProps) {
  const isActive = value.trim().length > 0;
  const inputClassName = cn(
    'h-7 w-full min-w-[72px] text-xs',
    isActive && 'border-primary/60 bg-primary/5',
  );

  if (filter.type === 'select') {
    return (
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
  }

  if (filter.type === 'multi') {
    return (
      <GridMultiValueFilter
        value={value}
        onChange={onChange}
        placeholder={filter.placeholder ?? 'Adicionar...'}
        inputMode={filter.inputMode}
      />
    );
  }

  if (filter.type === 'dateRange') {
    return (
      <GridDateRangeFilter
        from={dateRangeFrom}
        to={dateRangeTo}
        onChange={(from, to) => onDateRangeChange?.(from, to)}
        placeholder={filter.placeholder ?? 'Período'}
      />
    );
  }

  if (filter.type === 'date') {
    return (
      <Input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClassName}
      />
    );
  }

  return (
    <Input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={filter.placeholder ?? 'Filtrar...'}
      className={inputClassName}
    />
  );
}
