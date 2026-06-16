import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { useEquipamentoDashboardResumo } from '@/hooks/use-equipamento-dashboard-resumo';
import { cn } from '@/lib/utils';

type StatItem = {
  label: string;
  value: number | string;
  to?: string;
  accent?: string;
};

export function EquipamentoStatsBar() {
  const { data: resumo, isLoading } = useEquipamentoDashboardResumo();

  if (isLoading) {
    return (
      <div className="grid min-w-0 grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const stats: StatItem[] = [
    { label: 'Em estoque', value: resumo?.em_estoque ?? 0, to: '/equipamentos/estoque', accent: 'text-emerald-600' },
    { label: 'Em uso', value: resumo?.em_utilizacao ?? 0, to: '/equipamentos/movimentacoes', accent: 'text-blue-600' },
    { label: 'Manutenção', value: resumo?.em_manutencao ?? 0, to: '/equipamentos/manutencao', accent: 'text-amber-600' },
    { label: 'Críticos', value: resumo?.criticos ?? 0, to: '/equipamentos/estoque?filtro=criticos', accent: 'text-red-600' },
  ];

  return (
    <div className="grid min-w-0 grid-cols-4 gap-2">
      {stats.map((stat) => {
        const content = (
          <>
            <span className={cn('text-xl font-bold tabular-nums leading-none', stat.accent)}>
              {stat.value}
            </span>
            <span className="mt-1 text-[10px] font-medium text-muted-foreground">{stat.label}</span>
          </>
        );

        const className =
          'flex min-h-[4.5rem] w-full min-w-0 flex-col justify-center rounded-xl border border-border bg-card px-3 py-2.5 shadow-sm transition-colors hover:bg-muted/40';

        return stat.to ? (
          <Link key={stat.label} to={stat.to} className={className}>
            {content}
          </Link>
        ) : (
          <div key={stat.label} className={className}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
