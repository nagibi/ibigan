import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, ChevronDown } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

function parseFilterDate(value: string): Date | undefined {
  if (!value) return undefined;
  try {
    return parseISO(value);
  } catch {
    return undefined;
  }
}

function formatFilterDate(value: string): string {
  const date = parseFilterDate(value);
  if (!date) return value;
  return format(date, 'dd/MM/yy', { locale: ptBR });
}

export function formatDateRangeFilterLabel(from: string, to: string): string {
  if (from && to) return `${formatFilterDate(from)} — ${formatFilterDate(to)}`;
  if (from) return `De ${formatFilterDate(from)}`;
  if (to) return `Até ${formatFilterDate(to)}`;
  return '';
}

function toIsoDate(date?: Date): string {
  if (!date) return '';
  return format(date, 'yyyy-MM-dd');
}

interface GridDateRangeFilterProps {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
  placeholder?: string;
}

export function GridDateRangeFilter({
  from,
  to,
  onChange,
  placeholder = 'Período',
}: GridDateRangeFilterProps) {
  const [open, setOpen] = useState(false);
  const [tempRange, setTempRange] = useState<DateRange | undefined>();

  const isActive = Boolean(from || to);
  const label = isActive ? formatDateRangeFilterLabel(from, to) : placeholder;

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setTempRange({
        from: parseFilterDate(from),
        to: parseFilterDate(to),
      });
    }
    setOpen(nextOpen);
  }

  function handleApply() {
    onChange(toIsoDate(tempRange?.from), toIsoDate(tempRange?.to));
    setOpen(false);
  }

  function handleClear() {
    setTempRange(undefined);
    onChange('', '');
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
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
          mode="range"
          numberOfMonths={2}
          selected={tempRange}
          defaultMonth={tempRange?.from ?? parseFilterDate(from)}
          onSelect={setTempRange}
          locale={ptBR}
        />
        <div className="flex items-center justify-end gap-1.5 border-t border-border p-2">
          <Button type="button" variant="outline" size="sm" onClick={handleClear}>
            Limpar
          </Button>
          <Button type="button" size="sm" onClick={handleApply}>
            Aplicar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
