import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { GridColumnFilterDef } from '@/hooks/use-grid-filters';
import { parseMultiFilterValue } from '@/components/grid/grid-multi-value-filter';
import { GridDateFilter } from '@/components/grid/grid-date-filter';
import { GridDateRangeFilter } from '@/components/grid/grid-date-range-filter';
import { GridMultiValueFilter } from '@/components/grid/grid-multi-value-filter';
import { GridSelectMultiFilter } from '@/components/grid/grid-select-multi-filter';
import { MaskedInput } from '@/components/ui/masked-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface GridColumnFilterProps {
  filter: GridColumnFilterDef;
  value: string;
  onChange: (value: string) => void;
  dateRangeFrom?: string;
  dateRangeTo?: string;
  onDateRangeChange?: (from: string, to: string) => void;
  onClear?: () => void;
  layout?: 'inline' | 'stacked';
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

  if (filter.type === 'select') {
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
  layout = 'inline',
}: GridColumnFilterProps) {
  const { t } = useTranslation();
  const isActive = isFilterActive(filter, value, dateRangeFrom, dateRangeTo);
  const inputClassName = cn(
    'h-7 w-full min-w-0 text-xs',
    layout === 'inline' && 'min-w-[72px]',
    isActive && 'border-primary/60 bg-primary/5',
  );

  let control: ReactNode;

  if (filter.type === 'select') {
    control = (
      <GridSelectMultiFilter
        value={value}
        onChange={onChange}
        options={filter.options ?? []}
        placeholder={filter.placeholder ?? 'Todos'}
      />
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
        placeholder={filter.placeholder ?? t('grid.date_period')}
        fullWidth={layout === 'stacked'}
      />
    );
  } else if (filter.type === 'date') {
    control = (
      <GridDateFilter
        value={value}
        onChange={onChange}
        placeholder={filter.placeholder ?? t('grid.date_period')}
      />
    );
  } else if (filter.mask) {
    control = (
      <MaskedInput
        mask={filter.mask}
        value={value}
        onChange={onChange}
        placeholder={filter.placeholder ?? 'Filtrar...'}
        variant="sm"
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
    <div className={cn('flex items-center gap-0.5', layout === 'stacked' && 'w-full')}>
      <div className="min-w-0 flex-1">{control}</div>
      {isActive && onClear && (
        <Button
          type="button"
          variant="ghost"
          mode="icon"
          size="sm"
          className="size-6 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={onClear}
          title={t('grid.clear_filter')}
        >
          <X className="size-3" />
        </Button>
      )}
    </div>
  );
}
