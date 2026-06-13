import { Check, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { GridColumnFilterOption } from '@/hooks/use-grid-filters';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  joinMultiFilterValue,
  parseMultiFilterValue,
} from '@/components/grid/grid-multi-value-filter';

function formatTriggerLabel(
  selected: string[],
  options: GridColumnFilterOption[],
  placeholder: string,
) {
  if (selected.length === 0) return placeholder;

  const labels = selected.map(
    (value) => options.find((option) => option.value === value)?.label ?? value,
  );

  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]}, ${labels[1]}`;
  return `${labels[0]}, ${labels[1]} +${labels.length - 2}`;
}

interface GridSelectMultiFilterProps {
  value: string;
  onChange: (value: string) => void;
  options: GridColumnFilterOption[];
  placeholder?: string;
}

export function GridSelectMultiFilter({
  value,
  onChange,
  options,
  placeholder = 'Todos',
}: GridSelectMultiFilterProps) {
  const { t } = useTranslation();
  const selected = parseMultiFilterValue(value);
  const isActive = selected.length > 0;

  function toggleOption(optionValue: string) {
    const next = selected.includes(optionValue)
      ? selected.filter((current) => current !== optionValue)
      : [...selected, optionValue];

    onChange(joinMultiFilterValue(next));
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex h-7 w-full min-w-[88px] items-center justify-between gap-1 rounded-md border border-input bg-background px-2 text-left text-xs shadow-xs transition-colors hover:bg-muted/40',
            isActive && 'border-primary/50 bg-primary/5 text-foreground',
          )}
        >
          <span className={cn('truncate', !isActive && 'text-muted-foreground')}>
            {formatTriggerLabel(selected, options, placeholder)}
          </span>
          <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-56 p-2">
        <div className="mb-1 flex items-center justify-between px-1">
          <p className="text-xs font-medium text-muted-foreground">{placeholder}</p>
          {isActive && (
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={() => onChange('')}
            >
              {t('common.clear')}
            </button>
          )}
        </div>

        <div className="max-h-56 space-y-0.5 overflow-y-auto">
          {options.map((option) => {
            const checked = selected.includes(option.value);

            return (
              <Button
                key={option.value}
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  'h-8 w-full justify-start gap-2 px-2 text-xs font-normal',
                  checked && 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary',
                )}
                onClick={() => toggleOption(option.value)}
              >
                <span
                  className={cn(
                    'flex size-4 shrink-0 items-center justify-center rounded border',
                    checked
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-input bg-background',
                  )}
                >
                  {checked ? <Check className="size-3" /> : null}
                </span>
                <span className="truncate">{option.label}</span>
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
