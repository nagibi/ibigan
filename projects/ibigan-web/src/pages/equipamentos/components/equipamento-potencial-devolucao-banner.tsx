import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronRight, Filter, Lightbulb } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { formatEquipamentoCurrency } from '@/lib/equipamento-utils';
import {
  ESTOQUE_POTENCIAL_DEVOLUCAO_FILTER,
  FILTER_LABELS,
  resolveContextFilter,
} from '@/lib/equipamento-filters';
import type { DashboardPotencialDevolucao } from '@/types/equipamento';

type EquipamentoPotencialDevolucaoBannerProps = {
  data?: DashboardPotencialDevolucao;
  isLoading?: boolean;
};

export function EquipamentoPotencialDevolucaoBanner({
  data,
  isLoading,
}: EquipamentoPotencialDevolucaoBannerProps) {
  const [expanded, setExpanded] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const isFilterActive =
    resolveContextFilter('estoque', searchParams.get('filtro')) ===
    ESTOQUE_POTENCIAL_DEVOLUCAO_FILTER;

  const applyFilter = () => {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        params.set('filtro', ESTOQUE_POTENCIAL_DEVOLUCAO_FILTER);
        return params;
      },
      { replace: true },
    );
    setExpanded(true);
  };

  const clearFilter = () => {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        params.delete('filtro');
        return params;
      },
      { replace: true },
    );
  };

  if (isLoading || !data || data.total <= 0) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-amber-500/50 bg-gradient-to-r from-amber-500/15 to-orange-500/10">
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-amber-500/25 text-amber-700 dark:text-amber-400">
          <AlertTriangle className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold uppercase tracking-wide text-amber-900 dark:text-amber-100">
            Equipamentos com potencial de devolução
          </p>
          <p className="mt-0.5 text-sm font-semibold text-amber-950 dark:text-amber-50">
            {data.total} equipamento{data.total === 1 ? '' : 's'}
          </p>
          <p className="text-xs font-medium text-amber-800/90 dark:text-amber-200/90">
            {formatEquipamentoCurrency(data.valor_mensal_total)}/mês em custo parado
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-amber-800 transition-colors hover:text-amber-950 dark:text-amber-200 dark:hover:text-amber-50"
        >
          Ver
          {expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
        </button>
      </div>

      {expanded ? (
        <div className="space-y-2 border-t border-amber-500/30 bg-background/40 px-4 py-3">
          {data.sugestoes.map((sugestao) => (
            <div
              key={sugestao.id}
              className="flex items-start gap-2 rounded-lg border border-border/70 bg-background/80 px-3 py-2.5 text-sm"
            >
              <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-600" />
              <p className="text-foreground/90">{sugestao.mensagem}</p>
            </div>
          ))}
          <div className="flex flex-wrap gap-2 pt-1">
            {isFilterActive ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 border-amber-600/40 text-xs font-semibold text-amber-900 dark:text-amber-100"
                onClick={clearFilter}
              >
                Todos
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 border-amber-600/40 text-xs font-semibold text-amber-900 dark:text-amber-100"
                onClick={applyFilter}
              >
                <Filter className="size-3.5" />
                Aplicar filtro de {FILTER_LABELS[ESTOQUE_POTENCIAL_DEVOLUCAO_FILTER].toLowerCase()}
              </Button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
