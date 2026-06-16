import { Skeleton } from '@/components/ui/skeleton';
import { useEquipamentoDashboardResumo } from '@/hooks/use-equipamento-dashboard-resumo';
import { cn } from '@/lib/utils';

export function EquipamentoUtilizacaoBar() {
  const { data: resumo, isLoading } = useEquipamentoDashboardResumo();

  if (isLoading) {
    return <Skeleton className="h-14 w-full rounded-xl" />;
  }

  const emUso = resumo?.em_utilizacao ?? 0;
  const emEstoque = resumo?.em_estoque ?? 0;
  const frotaAtiva = emUso + emEstoque;
  const percentual = frotaAtiva > 0 ? Math.round((emUso / frotaAtiva) * 100) : 0;

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Utilização
          </p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">
            {emUso} de {frotaAtiva} equipamentos emprestados
          </p>
        </div>
        <span className="text-2xl font-bold tabular-nums text-primary">{percentual}%</span>
      </div>
      <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            percentual >= 70 ? 'bg-emerald-500' : percentual >= 40 ? 'bg-blue-500' : 'bg-amber-500',
          )}
          style={{ width: `${percentual}%` }}
        />
      </div>
    </div>
  );
}
