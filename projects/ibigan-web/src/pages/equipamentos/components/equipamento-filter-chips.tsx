import { useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  FILTER_LABELS,
  getFiltersForMode,
  resolveContextFilter,
  type EquipamentoContextFilter,
} from '@/lib/equipamento-filters';
import type { EquipamentoListMode } from '@/pages/equipamentos/equipamentos-list-page';

type EquipamentoFilterChipsProps = {
  mode: EquipamentoListMode;
};

export function EquipamentoFilterChips({ mode }: EquipamentoFilterChipsProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const filtroParam = searchParams.get('filtro');
  const activeFilter = resolveContextFilter(mode, filtroParam);
  const filters = getFiltersForMode(mode);

  if (filters.length === 0) {
    return null;
  }

  const handleSelect = (filter: EquipamentoContextFilter) => {
    if (filter === activeFilter) {
      return;
    }

    const params = new URLSearchParams(searchParams);

    if (filter === 'todos') {
      params.delete('filtro');
    } else {
      params.set('filtro', filter);
    }

    setSearchParams(params, { replace: true });
  };

  return (
    <div className="grid min-w-0 grid-cols-4 gap-2">
        {filters.map((filter) => {
          const isActive = filter === activeFilter;

          return (
            <button
              key={filter}
              type="button"
              aria-pressed={isActive}
              onClick={() => handleSelect(filter)}
              className={cn(
                'w-full min-w-0 rounded-full border px-2 py-1 text-[11px] font-medium transition-colors sm:px-3 sm:text-xs',
                isActive
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground',
              )}
            >
              <span className="block truncate">{FILTER_LABELS[filter]}</span>
            </button>
          );
        })}
    </div>
  );
}
