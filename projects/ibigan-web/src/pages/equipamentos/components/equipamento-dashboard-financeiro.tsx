import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  DollarSign,
  Lightbulb,
  PackageOpen,
  TrendingDown,
  TrendingUp,
  Users,
  Wrench,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatEquipamentoCurrency } from '@/lib/equipamento-utils';
import { cn } from '@/lib/utils';
import { equipamentosService } from '@/services/equipamentos.service';
import type { DashboardRecomendacao } from '@/types/equipamento';

const CHART_COLORS = {
  blue: '#378ADD',
  green: '#1D9E75',
  amber: '#EF9F27',
  red: '#E24B4A',
  gray: '#888780',
  violet: '#7C3AED',
};

const STATUS_COLORS: Record<string, string> = {
  em_estoque: CHART_COLORS.gray,
  em_utilizacao: CHART_COLORS.blue,
  em_manutencao: CHART_COLORS.amber,
  baixado: CHART_COLORS.green,
  perdido: CHART_COLORS.red,
};

const EMPRESTIMO_COLORS: Record<string, string> = {
  normais: CHART_COLORS.green,
  proximos: CHART_COLORS.amber,
  vencidos: CHART_COLORS.red,
};

const RECOMENDACAO_ICON = {
  'trending-down': TrendingDown,
  wrench: Wrench,
  chart: BarChart3,
} as const;

function ChartBox({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('min-w-0 w-full max-w-full overflow-hidden', className)}>{children}</div>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  valueFormatter?: (value: number, name: string) => string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-md border border-border bg-popover px-2.5 py-2 text-xs shadow-md">
      {label ? <p className="mb-1 font-medium text-muted-foreground">{label}</p> : null}
      {payload.map((item) => (
        <p key={item.name} style={{ color: item.color }}>
          {item.name}:{' '}
          <span className="font-medium">
            {valueFormatter ? valueFormatter(item.value, item.name) : item.value}
          </span>
        </p>
      ))}
    </div>
  );
}

function RecomendacaoCard({ item }: { item: DashboardRecomendacao }) {
  const Icon = RECOMENDACAO_ICON[item.icone];

  return (
    <div className="flex gap-3 rounded-lg border bg-muted/30 p-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-background">
        <Icon className="size-4 text-primary" />
      </div>
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-medium">{item.titulo}</p>
        <p className="text-xs text-muted-foreground">{item.descricao}</p>
        {item.economia_mensal != null && item.economia_mensal > 0 ? (
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
            Economia potencial: {formatEquipamentoCurrency(item.economia_mensal)}/mês
          </p>
        ) : null}
      </div>
    </div>
  );
}

function formatObraLabel(item: { codigo?: string | null; nome?: string | null; obra_id: number }) {
  if (item.codigo && item.nome) return `${item.codigo} · ${item.nome}`;
  return item.nome ?? item.codigo ?? `Obra #${item.obra_id}`;
}

function TrendHint({
  current,
  previous,
  formatter,
  invert = false,
}: {
  current: number;
  previous?: number;
  formatter: (value: number) => string;
  invert?: boolean;
}) {
  if (previous == null || previous === current) return null;

  const improved = invert ? current < previous : current > previous;

  return (
    <p
      className={cn(
        'flex items-center gap-1 text-[11px] font-medium',
        improved ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400',
      )}
    >
      {improved ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
      {formatter(current)} vs {formatter(previous)} no mês anterior
    </p>
  );
}

export function EquipamentoDashboardFinanceiro() {
  const { data: financeiro, isLoading: loadingFinanceiro } = useQuery({
    queryKey: ['equipamentos-dashboard', 'financeiro'],
    queryFn: () => equipamentosService.dashboardFinanceiro(),
  });

  const { data: graficos, isLoading: loadingGraficos } = useQuery({
    queryKey: ['equipamentos-dashboard', 'graficos'],
    queryFn: () => equipamentosService.dashboardGraficos(),
  });

  const isLoading = loadingFinanceiro || loadingGraficos;
  const recomendacoes = graficos?.recomendacoes ?? financeiro?.recomendacoes ?? [];

  const utilizacao = graficos?.evolucao_utilizacao ?? [];
  const ociosidade = graficos?.evolucao_ociosidade ?? [];
  const ultimaUtilizacao = utilizacao.at(-1)?.percentual;
  const penultimaUtilizacao = utilizacao.at(-2)?.percentual;
  const ultimaOciosidade = ociosidade.at(-1)?.valor_mensal;
  const penultimaOciosidade = ociosidade.at(-2)?.valor_mensal;

  const statusData =
    graficos?.equipamentos_por_status.map((item) => ({
      name: item.label,
      value: item.total,
      color: STATUS_COLORS[item.status] ?? CHART_COLORS.gray,
    })) ?? [];

  const emprestimosData =
    graficos?.emprestimos_situacao.map((item) => ({
      name: item.label,
      value: item.total,
      color: EMPRESTIMO_COLORS[item.id] ?? CHART_COLORS.gray,
    })) ?? [];

  const obrasData =
    graficos?.custos_por_obra.map((item) => ({
      name: item.codigo ?? `#${item.obra_id}`,
      label: formatObraLabel(item),
      valor: item.valor_mensal,
    })) ?? [];

  const gruposData = graficos?.custos_por_grupo ?? [];

  const kpis = [
    {
      label: 'Custo mensal total',
      value: financeiro ? formatEquipamentoCurrency(financeiro.custo_mensal_total) : '—',
      hint: 'Frota ativa (sem baixados)',
      icon: DollarSign,
    },
    {
      label: 'Equipamentos ociosos',
      value: financeiro ? String(financeiro.equipamentos_ociosos.total) : '—',
      hint: financeiro
        ? `${formatEquipamentoCurrency(financeiro.equipamentos_ociosos.valor_mensal)}/mês · parados 30+ dias`
        : 'Parados há mais de 30 dias',
      icon: PackageOpen,
    },
    {
      label: 'Economia potencial',
      value: financeiro ? formatEquipamentoCurrency(financeiro.economia_potencial_mensal) : '—',
      hint: 'Devolução ou realocação de ociosos',
      icon: TrendingDown,
      tone: 'text-emerald-700 dark:text-emerald-400',
    },
    {
      label: 'Média por colaborador',
      value: financeiro ? String(financeiro.colaboradores.media_emprestimos_ativos) : '—',
      hint: 'Empréstimos ativos por pessoa',
      icon: Users,
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Dashboard executivo</h2>
        <p className="text-xs text-muted-foreground">
          Tendências, distribuição do parque e recomendações de decisão
        </p>
      </div>

      <Card className="border-amber-200/60 bg-amber-50/30 dark:border-amber-900/40 dark:bg-amber-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="size-4 text-amber-600" />
            Recomendações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : recomendacoes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma recomendação no momento — parque em equilíbrio.
            </p>
          ) : (
            <div className="grid gap-2 md:grid-cols-2">
              {recomendacoes.map((item) => (
                <RecomendacaoCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {loadingFinanceiro
          ? Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-24 rounded-xl" />
            ))
          : kpis.map((kpi) => (
              <Card key={kpi.label}>
                <CardContent className="space-y-1 p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <kpi.icon className="size-3.5 shrink-0" />
                    <span>{kpi.label}</span>
                  </div>
                  <p className={cn('text-xl font-semibold tabular-nums', kpi.tone)}>{kpi.value}</p>
                  <p className="text-[11px] leading-snug text-muted-foreground">{kpi.hint}</p>
                </CardContent>
              </Card>
            ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Utilização do parque</CardTitle>
            <TrendHint
              current={ultimaUtilizacao ?? 0}
              previous={penultimaUtilizacao}
              formatter={(value) => `${value}%`}
            />
          </CardHeader>
          <CardContent>
            {loadingGraficos ? (
              <Skeleton className="h-52 w-full" />
            ) : (
              <ChartBox className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={utilizacao} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.15)" />
                    <XAxis dataKey="mes" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      width={32}
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip
                      content={
                        <ChartTooltip valueFormatter={(value) => `${value}%`} />
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="percentual"
                      name="Utilização"
                      stroke={CHART_COLORS.blue}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartBox>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Evolução da ociosidade</CardTitle>
            <TrendHint
              current={ultimaOciosidade ?? 0}
              previous={penultimaOciosidade}
              formatter={formatEquipamentoCurrency}
              invert
            />
          </CardHeader>
          <CardContent>
            {loadingGraficos ? (
              <Skeleton className="h-52 w-full" />
            ) : (
              <ChartBox className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ociosidade} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.15)" />
                    <XAxis dataKey="mes" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      width={56}
                      tickFormatter={(value) =>
                        value >= 1000 ? `${Math.round(value / 1000)}k` : String(value)
                      }
                    />
                    <Tooltip
                      content={
                        <ChartTooltip
                          valueFormatter={(value) => formatEquipamentoCurrency(value)}
                        />
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="valor_mensal"
                      name="Ociosidade"
                      stroke={CHART_COLORS.green}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartBox>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Custo mensal por situação</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingGraficos ? (
            <Skeleton className="h-56 w-full" />
          ) : (
            <ChartBox className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={graficos?.custos_mensais ?? []}
                  barGap={2}
                  barCategoryGap="18%"
                  margin={{ top: 4, right: 4, left: -8, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.15)" />
                  <XAxis dataKey="mes" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={56}
                    tickFormatter={(value) =>
                      value >= 1000 ? `${Math.round(value / 1000)}k` : String(value)
                    }
                  />
                  <Tooltip
                    content={
                      <ChartTooltip
                        valueFormatter={(value) => formatEquipamentoCurrency(value)}
                      />
                    }
                  />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="em_uso" name="Em uso" stackId="a" fill={CHART_COLORS.blue} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="ocioso" name="Ocioso" stackId="a" fill={CHART_COLORS.red} />
                  <Bar dataKey="manutencao" name="Manutenção" stackId="a" fill={CHART_COLORS.amber} />
                  <Bar dataKey="estoque" name="Estoque" stackId="a" fill={CHART_COLORS.gray} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartBox>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Equipamentos por status</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingGraficos ? (
              <Skeleton className="h-52 w-full" />
            ) : (
              <ChartBox className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData.length ? statusData : [{ name: 'Sem dados', value: 1, color: CHART_COLORS.gray }]}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={78}
                      paddingAngle={3}
                    >
                      {(statusData.length ? statusData : [{ color: CHART_COLORS.gray }]).map((entry, index) => (
                        <Cell key={index} fill={'color' in entry ? entry.color : CHART_COLORS.gray} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartBox>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Situação dos empréstimos</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingGraficos ? (
              <Skeleton className="h-52 w-full" />
            ) : (
              <ChartBox className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={
                        emprestimosData.length
                          ? emprestimosData
                          : [{ name: 'Sem empréstimos', value: 1, color: CHART_COLORS.gray }]
                      }
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={78}
                      paddingAngle={3}
                    >
                      {(emprestimosData.length ? emprestimosData : [{ color: CHART_COLORS.gray }]).map(
                        (entry, index) => (
                          <Cell key={index} fill={'color' in entry ? entry.color : CHART_COLORS.gray} />
                        ),
                      )}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartBox>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top obras por custo</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingGraficos ? (
              <Skeleton className="h-64 w-full" />
            ) : obrasData.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum empréstimo ativo.</p>
            ) : (
              <ChartBox className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={obrasData}
                    layout="vertical"
                    margin={{ top: 0, right: 12, left: 4, bottom: 0 }}
                    barSize={14}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(128,128,128,0.15)" />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) =>
                        value >= 1000 ? `${Math.round(value / 1000)}k` : String(value)
                      }
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={48}
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      content={
                        <ChartTooltip
                          valueFormatter={(value, name) =>
                            name === 'valor' ? formatEquipamentoCurrency(value) : String(value)
                          }
                        />
                      }
                    />
                    <Bar dataKey="valor" name="Custo mensal" fill={CHART_COLORS.blue} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartBox>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Custos por categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingGraficos ? (
              <Skeleton className="h-64 w-full" />
            ) : gruposData.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum equipamento na frota.</p>
            ) : (
              <ChartBox className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={gruposData}
                    margin={{ top: 4, right: 4, left: -8, bottom: 0 }}
                    barCategoryGap="20%"
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.15)" />
                    <XAxis
                      dataKey="grupo"
                      tick={{ fontSize: 9 }}
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                      height={52}
                    />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      width={56}
                      tickFormatter={(value) =>
                        value >= 1000 ? `${Math.round(value / 1000)}k` : String(value)
                      }
                    />
                    <Tooltip
                      content={
                        <ChartTooltip
                          valueFormatter={(value) => formatEquipamentoCurrency(value)}
                        />
                      }
                    />
                    <Bar dataKey="valor_mensal" name="Custo mensal" fill={CHART_COLORS.violet} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartBox>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Custos de manutenção</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingGraficos ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <ChartBox className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={graficos?.manutencao.evolucao_custos ?? []}
                    margin={{ top: 4, right: 4, left: -8, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.15)" />
                    <XAxis dataKey="mes" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={48} />
                    <Tooltip
                      content={
                        <ChartTooltip
                          valueFormatter={(value) => formatEquipamentoCurrency(value)}
                        />
                      }
                    />
                    <Bar dataKey="valor_mensal" name="Custo" fill={CHART_COLORS.amber} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartBox>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Manutenção hoje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {loadingGraficos ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <>
                <div>
                  <p className="text-xs text-muted-foreground">Tempo médio</p>
                  <p className="text-2xl font-semibold tabular-nums">
                    {graficos?.manutencao.tempo_medio_dias ?? 0} dias
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Equipamentos parados</p>
                  <p className="text-2xl font-semibold tabular-nums">
                    {graficos?.manutencao.equipamentos_parados ?? 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Custo mensal</p>
                  <p className="text-2xl font-semibold tabular-nums">
                    {formatEquipamentoCurrency(graficos?.manutencao.custo_mensal ?? 0)}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Colaboradores — heatmap operacional</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loadingGraficos ? (
            <Skeleton className="h-40 w-full" />
          ) : (graficos?.colaboradores_heatmap ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum empréstimo ativo.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead className="text-right">Dias médios</TableHead>
                  <TableHead className="text-right">Renovações</TableHead>
                  <TableHead className="text-right">Ativos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(graficos?.colaboradores_heatmap ?? []).map((item) => (
                  <TableRow key={item.colaborador_matricula}>
                    <TableCell className="max-w-[180px] truncate">
                      {item.colaborador_nome} · {item.colaborador_matricula}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {item.media_dias_em_uso ?? 0}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-right tabular-nums',
                        (item.total_renovacoes ?? 0) >= 3 && 'font-semibold text-amber-700 dark:text-amber-400',
                      )}
                    >
                      {item.total_renovacoes ?? 0}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-right tabular-nums',
                        (item.total_emprestimos_ativos ?? 0) >= 3 && 'font-semibold text-red-700 dark:text-red-400',
                      )}
                    >
                      {item.total_emprestimos_ativos ?? 0}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
