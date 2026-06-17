import { useState } from 'react';
import { EquipamentoDashboardFinanceiro } from '@/pages/equipamentos/components/equipamento-dashboard-financeiro';
import { CadastroEquipamentoModal } from '@/pages/equipamentos/components/equipamento-modals';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Plus } from 'lucide-react';
import type { EquipamentoStatus } from '@/types/equipamento';
import {
  EQUIPAMENTO_STATUS_STYLES,
  EQUIPAMENTO_TOTAL_CARD_STYLE,
} from '@/lib/equipamento-labels';
import { cn } from '@/lib/utils';
import { usePageToolbar } from '@/hooks/use-page-toolbar';
import { equipamentosService } from '@/services/equipamentos.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function EquipamentosGestaoPage() {
  const [cadastroOpen, setCadastroOpen] = useState(false);

  const { data: resumo, isLoading: loadingResumo } = useQuery({
    queryKey: ['equipamentos-dashboard', 'resumo'],
    queryFn: () => equipamentosService.dashboardResumo(),
  });

  const { data: alertas, isLoading: loadingAlertas } = useQuery({
    queryKey: ['equipamentos-dashboard', 'alertas'],
    queryFn: () => equipamentosService.dashboardAlertas(),
  });

  const { data: rankings, isLoading: loadingRankings } = useQuery({
    queryKey: ['equipamentos-dashboard', 'rankings'],
    queryFn: () => equipamentosService.dashboardRankings(),
  });

  const stats: Array<{
    key: 'total' | EquipamentoStatus;
    label: string;
    value: number | undefined;
  }> = [
    { key: 'total', label: 'Total', value: resumo?.total },
    { key: 'em_estoque', label: 'Estoque', value: resumo?.em_estoque },
    { key: 'em_utilizacao', label: 'Em uso', value: resumo?.em_utilizacao },
    { key: 'em_manutencao', label: 'Manutenção', value: resumo?.em_manutencao },
    { key: 'baixado', label: 'Baixados', value: resumo?.baixados },
    { key: 'perdido', label: 'Perdidos', value: resumo?.perdidos },
  ];

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-col gap-6 pb-2">
      <EquipamentoDashboardFinanceiro />

      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Operação</h2>
          <p className="text-xs text-muted-foreground">
            Estoque, alertas e rankings de uso
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {loadingResumo
            ? Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-20 rounded-xl" />
              ))
            : stats.map((stat) => {
                const styles =
                  stat.key === 'total'
                    ? EQUIPAMENTO_TOTAL_CARD_STYLE
                    : EQUIPAMENTO_STATUS_STYLES[stat.key];

                return (
                  <Card
                    key={stat.label}
                    className={cn('overflow-hidden', styles.card)}
                  >
                    <CardContent className="flex gap-3 p-4">
                      <div
                        className={cn('w-1 shrink-0 rounded-full', styles.bar)}
                        aria-hidden
                      />
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span
                            className={cn(
                              'size-1.5 shrink-0 rounded-full',
                              styles.dot,
                            )}
                            aria-hidden
                          />
                          {stat.label}
                        </p>
                        <p
                          className={cn(
                            'text-2xl font-semibold tabular-nums',
                            styles.value,
                          )}
                        >
                          {stat.value ?? 0}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4 text-amber-600" />
              Alertas de vencimento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {loadingAlertas ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <>
                <div>
                  <p className="font-medium text-destructive">
                    Vencidos ({alertas?.vencidos.total ?? 0})
                  </p>
                  <ul className="mt-2 space-y-1 text-muted-foreground">
                    {(alertas?.vencidos.itens ?? []).slice(0, 5).map((item) => (
                      <li key={item.emprestimo_id}>
                        {item.patrimonio} · {item.colaborador} ·{' '}
                        {item.dias_vencido} dias
                      </li>
                    ))}
                    {(alertas?.vencidos.total ?? 0) === 0 ? (
                      <li>Nenhum empréstimo vencido.</li>
                    ) : null}
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-amber-700 dark:text-amber-400">
                    Próximos do vencimento (
                    {alertas?.proximos_vencimento.total ?? 0})
                  </p>
                  <ul className="mt-2 space-y-1 text-muted-foreground">
                    {(alertas?.proximos_vencimento.itens ?? [])
                      .slice(0, 5)
                      .map((item) => (
                        <li key={item.emprestimo_id}>
                          {item.patrimonio} · {item.colaborador} ·{' '}
                          {item.dias_restantes} dias restantes
                        </li>
                      ))}
                    {(alertas?.proximos_vencimento.total ?? 0) === 0 ? (
                      <li>Nenhum empréstimo próximo do vencimento.</li>
                    ) : null}
                  </ul>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Mais utilizados</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingRankings ? (
                <Skeleton className="h-32 w-full" />
              ) : (
                <ul className="space-y-2 text-sm">
                  {(rankings?.mais_utilizados ?? []).slice(0, 5).map((item) => (
                    <li
                      key={item.patrimonio}
                      className="flex justify-between gap-2"
                    >
                      <span>
                        {item.patrimonio} · {item.tipo}
                      </span>
                      <span className="text-muted-foreground">
                        {item.total_dias} dias
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Mais manutenções</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingRankings ? (
                <Skeleton className="h-32 w-full" />
              ) : (
                <ul className="space-y-2 text-sm">
                  {(rankings?.mais_manutencao ?? []).slice(0, 5).map((item) => (
                    <li
                      key={item.patrimonio}
                      className="flex justify-between gap-2"
                    >
                      <span>
                        {item.patrimonio} · {item.tipo}
                      </span>
                      <span className="text-muted-foreground">
                        {item.total_manutencoes}x
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <CadastroEquipamentoModal
        open={cadastroOpen}
        onOpenChange={setCadastroOpen}
      />
    </div>
  );
}
