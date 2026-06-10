import type { ElementType } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface GridQuickFilterOption<T extends string> {
  value: T;
  label: string;
  icon?: ElementType;
  count?: number;
}

interface GridQuickFiltersProps<T extends string> {
  value: T;
  options: GridQuickFilterOption<T>[];
  onChange: (value: T) => void;
  className?: string;
}

export function GridQuickFilters<T extends string>({
  value,
  options,
  onChange,
  className,
}: GridQuickFiltersProps<T>) {
  return (
    <div className={cn('flex shrink-0 items-center gap-1.5', className)}>
      {options.map((option) => {
        const Icon = option.icon;
        const isActive = value === option.value;

        return (
          <Badge
            key={option.value}
            asChild
            variant={isActive ? 'primary' : 'outline'}
            appearance={isActive ? 'default' : 'light'}
            size="sm"
            className="cursor-pointer"
          >
            <button
              type="button"
              onClick={() => onChange(option.value)}
              className="inline-flex items-center gap-1"
            >
              {Icon ? <Icon className="size-3" /> : null}
              {option.label}
              {option.count !== undefined ? ` (${option.count})` : null}
            </button>
          </Badge>
        );
      })}
    </div>
  );
}
