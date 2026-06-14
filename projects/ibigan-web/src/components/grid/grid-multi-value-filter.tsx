import { useState } from 'react';
import { ChevronDown, Plus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export function parseMultiFilterValue(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function matchesIdFilter(id: number | string, filterValue?: string): boolean {
  const trimmed = filterValue?.trim();
  if (!trimmed) return true;

  const ids = parseMultiFilterValue(trimmed);
  if (ids.length === 0) return true;

  return ids.includes(String(id));
}

export function joinMultiFilterValue(items: string[]): string {
  return items.join(',');
}

function formatTriggerLabel(items: string[], placeholder: string) {
  if (items.length === 0) return placeholder;
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]}, ${items[1]}`;
  return `${items[0]}, ${items[1]} +${items.length - 2}`;
}

interface GridMultiValueFilterProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputMode?: 'text' | 'numeric';
}

export function GridMultiValueFilter({
  value,
  onChange,
  placeholder = 'Filtrar...',
  inputMode = 'text',
}: GridMultiValueFilterProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const items = parseMultiFilterValue(value);
  const isActive = items.length > 0;

  function addItem(raw: string) {
    const item = raw.trim();
    if (!item) return;

    if (inputMode === 'numeric' && Number.isNaN(Number(item))) return;
    if (items.includes(item)) {
      setInput('');
      return;
    }

    onChange(joinMultiFilterValue([...items, item]));
    setInput('');
  }

  function removeItem(item: string) {
    onChange(joinMultiFilterValue(items.filter((current) => current !== item)));
  }

  function clearAll() {
    onChange('');
    setInput('');
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex h-7 w-full min-w-[88px] items-center justify-between gap-1 rounded-md border border-input bg-background px-2 text-left text-xs shadow-xs transition-colors hover:bg-muted/40',
            isActive && 'border-primary/50 bg-primary/5 text-foreground',
          )}
        >
          <span className={cn('truncate', !isActive && 'text-muted-foreground')}>
            {formatTriggerLabel(items, placeholder)}
          </span>
          <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-64 p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">{placeholder}</p>
          {isActive && (
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={clearAll}
            >
              {t('common.clear')}
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ',') {
                event.preventDefault();
                addItem(input);
              }
            }}
            placeholder="Digite e pressione Enter"
            inputMode={inputMode === 'numeric' ? 'numeric' : undefined}
            className="h-8 flex-1 text-xs"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            mode="icon"
            className="size-8 shrink-0"
            disabled={!input.trim()}
            onClick={() => addItem(input)}
            title="Adicionar"
          >
            <Plus className="size-4" />
          </Button>
        </div>

        {items.length > 0 ? (
          <div className="mt-3 flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
            {items.map((item) => (
              <Badge
                key={item}
                variant="secondary"
                className="h-6 gap-1 px-2 text-xs font-normal"
              >
                <span className="max-w-[140px] truncate">{item}</span>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => removeItem(item)}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">
            {t('grid.no_items')}
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}
