import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useDateLocale } from '@/lib/date-locale';
import {
  formatFilterDate,
  parseFilterDate,
  toIsoDate,
} from '@/lib/grid-date-filter-utils';
import { cn } from '@/lib/utils';

interface GridDateFilterProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function GridDateFilter({
  value,
  onChange,
  placeholder,
}: GridDateFilterProps) {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const [open, setOpen] = useState(false);

  const isActive = Boolean(value);
  const selected = parseFilterDate(value);
  const label = isActive
    ? formatFilterDate(value, locale)
    : (placeholder ?? t('grid.date_period'));

  function handleSelect(date?: Date) {
    if (!date) return;
    onChange(toIsoDate(date));
    setOpen(false);
  }

  function handleClear() {
    onChange('');
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            'h-7 w-full min-w-[72px] justify-between gap-1 px-2 text-xs font-normal',
            isActive && 'border-primary/60 bg-primary/5',
          )}
        >
          <span className="flex min-w-0 items-center gap-1">
            <CalendarDays className="size-3 shrink-0 text-muted-foreground" />
            <span className="truncate">{label}</span>
          </span>
          <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onSelect={handleSelect}
          locale={locale}
        />
        {isActive && (
          <div className="flex items-center justify-end border-t border-border p-2">
            <Button type="button" variant="outline" size="sm" onClick={handleClear}>
              {t('common.clear')}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
