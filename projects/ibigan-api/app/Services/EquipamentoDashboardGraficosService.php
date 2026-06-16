<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Emprestimo;
use App\Models\Equipamento;
use App\Models\Manutencao;
use Carbon\Carbon;
use Illuminate\Support\Collection;

final class EquipamentoDashboardGraficosService
{
    /** @var list<string> */
    private const MESES_CURTOS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    /** @return array<string, mixed> */
    public function gerar(): array
    {
        $equipamentos = Equipamento::query()
            ->with([
                'tipo.grupo',
                'obra',
                'baixa',
                'historico' => fn ($query) => $query->orderByDesc('created_at'),
                'emprestimos',
                'manutencoes',
            ])
            ->get();

        $emprestimosAtivos = Emprestimo::query()
            ->with(['equipamento', 'renovacoes'])
            ->whereNull('data_devolucao')
            ->get();

        $meses = $this->ultimosMeses(6);
        $evolucaoUtilizacao = $meses->map(fn (array $mes) => [
            'mes' => $mes['mes'],
            'mes_key' => $mes['mes_key'],
            'percentual' => $this->utilizacaoMes($equipamentos, $mes['inicio'], $mes['fim']),
        ])->values();

        $evolucaoOciosidade = $meses->map(fn (array $mes) => [
            'mes' => $mes['mes'],
            'mes_key' => $mes['mes_key'],
            'valor_mensal' => $this->ociosidadeValorMes($equipamentos, $mes['fim']),
        ])->values();

        $custosMensais = $meses->map(function (array $mes) use ($equipamentos) {
            $custos = $this->custosSnapshotMes($equipamentos, $mes['fim']);

            return [
                'mes' => $mes['mes'],
                'mes_key' => $mes['mes_key'],
                ...$custos,
            ];
        })->values();

        $resumoStatus = $this->distribuicaoStatus($equipamentos);
        $emprestimosSituacao = $this->situacaoEmprestimos($emprestimosAtivos);
        $custosPorObra = $this->custosPorObra($emprestimosAtivos, 10);
        $custosPorGrupo = $this->custosPorGrupo($equipamentos);
        $manutencao = $this->metricasManutencao($equipamentos, $meses);
        $colaboradoresHeatmap = $this->heatmapColaboradores($emprestimosAtivos);
        $recomendacoes = $this->recomendacoes($equipamentos, $emprestimosAtivos);

        return [
            'evolucao_utilizacao' => $evolucaoUtilizacao,
            'evolucao_ociosidade' => $evolucaoOciosidade,
            'custos_mensais' => $custosMensais,
            'equipamentos_por_status' => $resumoStatus,
            'emprestimos_situacao' => $emprestimosSituacao,
            'custos_por_obra' => $custosPorObra,
            'custos_por_grupo' => $custosPorGrupo,
            'manutencao' => $manutencao,
            'colaboradores_heatmap' => $colaboradoresHeatmap,
            'recomendacoes' => $recomendacoes,
        ];
    }

    /** @return Collection<int, array{mes: string, mes_key: string, inicio: Carbon, fim: Carbon}> */
    private function ultimosMeses(int $quantidade): Collection
    {
        return collect(range($quantidade - 1, 0))->map(function (int $offset) {
            $referencia = now()->startOfMonth()->subMonths($offset);

            return [
                'mes' => self::MESES_CURTOS[$referencia->month - 1],
                'mes_key' => $referencia->format('Y-m'),
                'inicio' => $referencia->copy()->startOfMonth(),
                'fim' => $referencia->copy()->endOfMonth(),
            ];
        });
    }

    /** @param  Collection<int, Equipamento>  $equipamentos */
    private function utilizacaoMes(Collection $equipamentos, Carbon $inicio, Carbon $fim): float
    {
        $totalDias = 0;
        $diasEmUso = 0;

        foreach ($equipamentos as $equipamento) {
            [$eqInicio, $eqFim] = $this->periodoFrota($equipamento, $inicio, $fim);

            if ($eqInicio === null || $eqFim === null) {
                continue;
            }

            $dias = $eqInicio->diffInDays($eqFim) + 1;
            $totalDias += $dias;

            foreach ($equipamento->emprestimos as $emprestimo) {
                $empInicio = $eqInicio->copy()->max($emprestimo->data_retirada);
                $empFim = $eqFim->copy();

                if ($emprestimo->data_devolucao) {
                    $empFim = $empFim->min($emprestimo->data_devolucao);
                }

                if ($empInicio->lte($empFim)) {
                    $diasEmUso += $empInicio->diffInDays($empFim) + 1;
                }
            }
        }

        if ($totalDias === 0) {
            return 0;
        }

        return round(($diasEmUso / $totalDias) * 100, 1);
    }

    /** @param  Collection<int, Equipamento>  $equipamentos */
    private function ociosidadeValorMes(Collection $equipamentos, Carbon $referencia): float
    {
        $total = 0.0;

        foreach ($equipamentos as $equipamento) {
            if ($this->statusNaData($equipamento, $referencia) !== 'em_estoque') {
                continue;
            }

            if ($this->diasParadoEstoqueAte($equipamento, $referencia) >= 30) {
                $total += (float) $equipamento->valor_mensal;
            }
        }

        return round($total, 2);
    }

    /**
     * @param  Collection<int, Equipamento>  $equipamentos
     * @return array{total: float, em_uso: float, ocioso: float, manutencao: float, estoque: float}
     */
    private function custosSnapshotMes(Collection $equipamentos, Carbon $referencia): array
    {
        $emUso = 0.0;
        $ocioso = 0.0;
        $manutencao = 0.0;
        $estoque = 0.0;

        foreach ($equipamentos as $equipamento) {
            if ($this->statusNaData($equipamento, $referencia) === null) {
                continue;
            }

            $valor = (float) $equipamento->valor_mensal;
            $status = $this->statusNaData($equipamento, $referencia);

            if ($status === 'em_utilizacao') {
                $emUso += $valor;
            } elseif ($status === 'em_manutencao') {
                $manutencao += $valor;
            } elseif ($status === 'em_estoque' && $this->diasParadoEstoqueAte($equipamento, $referencia) >= 30) {
                $ocioso += $valor;
            } elseif ($status === 'em_estoque') {
                $estoque += $valor;
            }
        }

        return [
            'total' => round($emUso + $ocioso + $manutencao + $estoque, 2),
            'em_uso' => round($emUso, 2),
            'ocioso' => round($ocioso, 2),
            'manutencao' => round($manutencao, 2),
            'estoque' => round($estoque, 2),
        ];
    }

    /** @param  Collection<int, Equipamento>  $equipamentos */
    private function distribuicaoStatus(Collection $equipamentos): Collection
    {
        $labels = [
            'em_estoque' => 'Em estoque',
            'em_utilizacao' => 'Em uso',
            'em_manutencao' => 'Manutenção',
            'baixado' => 'Baixado',
            'perdido' => 'Perdido',
        ];

        $contagens = [
            'em_estoque' => 0,
            'em_utilizacao' => 0,
            'em_manutencao' => 0,
            'baixado' => 0,
            'perdido' => 0,
        ];

        foreach ($equipamentos as $equipamento) {
            $status = $equipamento->status;
            if (isset($contagens[$status])) {
                $contagens[$status]++;
            }
        }

        return collect($contagens)
            ->map(fn (int $total, string $status) => [
                'status' => $status,
                'label' => $labels[$status],
                'total' => $total,
            ])
            ->filter(fn (array $item) => $item['total'] > 0)
            ->values();
    }

    /** @param  Collection<int, Emprestimo>  $emprestimosAtivos */
    private function situacaoEmprestimos(Collection $emprestimosAtivos): Collection
    {
        $vencidos = $emprestimosAtivos->filter(fn (Emprestimo $emprestimo) => $emprestimo->is_vencido);
        $proximos = $emprestimosAtivos->filter(
            fn (Emprestimo $emprestimo) => $emprestimo->is_proximo_vencimento && ! $emprestimo->is_vencido
        );
        $normais = $emprestimosAtivos->count() - $vencidos->count() - $proximos->count();

        return collect([
            ['id' => 'normais', 'label' => 'Normais', 'total' => max($normais, 0)],
            ['id' => 'proximos', 'label' => 'Próximos do vencimento', 'total' => $proximos->count()],
            ['id' => 'vencidos', 'label' => 'Vencidos', 'total' => $vencidos->count()],
        ])->filter(fn (array $item) => $item['total'] > 0)->values();
    }

    /** @param  Collection<int, Emprestimo>  $emprestimosAtivos */
    private function custosPorObra(Collection $emprestimosAtivos, int $limite): Collection
    {
        return $emprestimosAtivos
            ->groupBy('obra_id')
            ->map(fn ($grupo) => [
                'obra_id' => $grupo->first()->obra_id,
                'codigo' => $grupo->first()->obra?->codigo,
                'nome' => $grupo->first()->obra?->nome,
                'valor_mensal' => round($grupo->sum(
                    fn (Emprestimo $emprestimo) => (float) $emprestimo->equipamento->valor_mensal
                ), 2),
            ])
            ->sortByDesc('valor_mensal')
            ->values()
            ->take($limite);
    }

    /** @param  Collection<int, Equipamento>  $equipamentos */
    private function custosPorGrupo(Collection $equipamentos): Collection
    {
        return $equipamentos
            ->filter(fn (Equipamento $equipamento) => $equipamento->baixa === null)
            ->groupBy(fn (Equipamento $equipamento) => $equipamento->tipo?->grupo?->nome ?? 'Outros')
            ->map(fn ($grupo, string $nome) => [
                'grupo' => $nome,
                'valor_mensal' => round($grupo->sum(fn (Equipamento $equipamento) => (float) $equipamento->valor_mensal), 2),
                'total' => $grupo->count(),
            ])
            ->sortByDesc('valor_mensal')
            ->values()
            ->take(8);
    }

    /**
     * @param  Collection<int, Equipamento>  $equipamentos
     * @param  Collection<int, array{mes: string, mes_key: string, inicio: Carbon, fim: Carbon}>  $meses
     * @return array<string, mixed>
     */
    private function metricasManutencao(Collection $equipamentos, Collection $meses): array
    {
        $manutencoes = Manutencao::query()->with('equipamento')->get();
        $emManutencao = $equipamentos->filter(fn (Equipamento $equipamento) => $equipamento->status === 'em_manutencao');

        $evolucao = $meses->map(function (array $mes) use ($manutencoes) {
            $valor = $manutencoes
                ->filter(function (Manutencao $manutencao) use ($mes) {
                    $fim = $manutencao->data_saida ?? now();
                    return $manutencao->data_entrada->lte($mes['fim'])
                        && $fim->gte($mes['inicio']);
                })
                ->sum(fn (Manutencao $manutencao) => (float) (
                    $manutencao->valor_mensal_snapshot ?: $manutencao->equipamento?->valor_mensal
                ));

            return [
                'mes' => $mes['mes'],
                'mes_key' => $mes['mes_key'],
                'valor_mensal' => round((float) $valor, 2),
            ];
        })->values();

        $finalizadas = $manutencoes->filter(fn (Manutencao $manutencao) => $manutencao->data_saida !== null);
        $tempoMedio = $finalizadas->isEmpty()
            ? 0
            : round($finalizadas->avg(fn (Manutencao $manutencao) => $manutencao->dias_em_manutencao), 1);

        return [
            'evolucao_custos' => $evolucao,
            'tempo_medio_dias' => $tempoMedio,
            'equipamentos_parados' => $emManutencao->count(),
            'custo_mensal' => round($emManutencao->sum(fn (Equipamento $equipamento) => (float) $equipamento->valor_mensal), 2),
        ];
    }

    /** @param  Collection<int, Emprestimo>  $emprestimosAtivos */
    private function heatmapColaboradores(Collection $emprestimosAtivos): Collection
    {
        return $emprestimosAtivos
            ->groupBy(fn (Emprestimo $emprestimo) => $emprestimo->colaborador_nome.'|'.$emprestimo->colaborador_matricula)
            ->map(fn ($grupo) => [
                'colaborador_nome' => $grupo->first()->colaborador_nome,
                'colaborador_matricula' => $grupo->first()->colaborador_matricula,
                'media_dias_em_uso' => round($grupo->avg(fn (Emprestimo $emprestimo) => $emprestimo->dias_em_uso), 1),
                'total_renovacoes' => $grupo->sum(fn (Emprestimo $emprestimo) => $emprestimo->renovacoes->count()),
                'total_emprestimos_ativos' => $grupo->count(),
            ])
            ->sortByDesc('total_emprestimos_ativos')
            ->values()
            ->take(10);
    }

    /**
     * @param  Collection<int, Equipamento>  $equipamentos
     * @param  Collection<int, Emprestimo>  $emprestimosAtivos
     * @return list<array<string, mixed>>
     */
    private function recomendacoes(Collection $equipamentos, Collection $emprestimosAtivos): array
    {
        $items = [];

        $parados = $equipamentos
            ->filter(fn (Equipamento $equipamento) => $equipamento->status === 'em_estoque'
                && ($equipamento->tempo_em_estoque ?? 0) >= 30)
            ->sortByDesc('valor_mensal')
            ->take(5);

        foreach ($parados as $equipamento) {
            $dias = $equipamento->tempo_em_estoque ?? 0;
            $items[] = [
                'id' => 'devolver-'.$equipamento->id,
                'icone' => 'trending-down',
                'titulo' => 'Devolver '.$equipamento->patrimonio,
                'descricao' => "Sem uso há {$dias} dias no estoque.",
                'economia_mensal' => (float) $equipamento->valor_mensal,
                'patrimonio' => $equipamento->patrimonio,
            ];
        }

        $problematicos = $equipamentos
            ->filter(fn (Equipamento $equipamento) => $equipamento->baixa === null)
            ->sortByDesc(fn (Equipamento $equipamento) => $equipamento->manutencoes->count())
            ->filter(fn (Equipamento $equipamento) => $equipamento->manutencoes->count() >= 3)
            ->take(3);

        foreach ($problematicos as $equipamento) {
            $total = $equipamento->manutencoes->count();
            $items[] = [
                'id' => 'revisar-'.$equipamento->id,
                'icone' => 'wrench',
                'titulo' => 'Revisar '.$equipamento->patrimonio,
                'descricao' => "{$total} manutenções registradas — pode indicar mau uso ou desgaste.",
                'patrimonio' => $equipamento->patrimonio,
            ];
        }

        $realocaveis = $equipamentos
            ->filter(fn (Equipamento $equipamento) => $equipamento->status === 'em_estoque'
                && ($equipamento->tempo_em_estoque ?? 0) >= 45)
            ->take(3);

        foreach ($realocaveis as $equipamento) {
            $dias = $equipamento->tempo_em_estoque ?? 0;
            $items[] = [
                'id' => 'realocar-'.$equipamento->id,
                'icone' => 'chart',
                'titulo' => 'Realocar '.$equipamento->patrimonio,
                'descricao' => "Parado há {$dias} dias — considere transferir para outra obra.",
                'patrimonio' => $equipamento->patrimonio,
            ];
        }

        $vencidos = $emprestimosAtivos->filter(fn (Emprestimo $emprestimo) => $emprestimo->is_vencido)->take(3);
        foreach ($vencidos as $emprestimo) {
            $items[] = [
                'id' => 'cobrar-'.$emprestimo->id,
                'icone' => 'trending-down',
                'titulo' => 'Cobrar devolução · '.$emprestimo->equipamento->patrimonio,
                'descricao' => $emprestimo->colaborador_nome.' · vencido há '.abs($emprestimo->dias_ate_vencimento).' dias.',
                'patrimonio' => $emprestimo->equipamento->patrimonio,
            ];
        }

        return $items;
    }

    /** @return array{0: ?Carbon, 1: ?Carbon} */
    private function periodoFrota(Equipamento $equipamento, Carbon $inicio, Carbon $fim): array
    {
        if ($equipamento->data_entrada->gt($fim)) {
            return [null, null];
        }

        $eqInicio = $inicio->copy()->max($equipamento->data_entrada);
        $eqFim = $fim->copy();

        if ($equipamento->baixa) {
            $eqFim = $eqFim->min($equipamento->baixa->data_baixa);
        }

        if ($eqInicio->gt($eqFim)) {
            return [null, null];
        }

        return [$eqInicio, $eqFim];
    }

    private function statusNaData(Equipamento $equipamento, Carbon $data): ?string
    {
        if ($equipamento->data_entrada->gt($data)) {
            return null;
        }

        if ($equipamento->baixa && $equipamento->baixa->data_baixa->lte($data)) {
            return $equipamento->baixa->tipo === 'perda' ? 'perdido' : 'baixado';
        }

        foreach ($equipamento->emprestimos as $emprestimo) {
            if ($emprestimo->data_retirada->lte($data)
                && ($emprestimo->data_devolucao === null || $emprestimo->data_devolucao->gt($data))) {
                return 'em_utilizacao';
            }
        }

        foreach ($equipamento->manutencoes as $manutencao) {
            if ($manutencao->data_entrada->lte($data)
                && ($manutencao->data_saida === null || $manutencao->data_saida->gt($data))) {
                return 'em_manutencao';
            }
        }

        return 'em_estoque';
    }

    private function diasParadoEstoqueAte(Equipamento $equipamento, Carbon $ate): int
    {
        $limite = $ate->copy()->endOfDay();

        $ultimoEvento = $equipamento->historico->first(
            fn ($evento) => $evento->status_resultante === 'em_estoque'
                && $evento->created_at->lte($limite)
        );

        if ($ultimoEvento) {
            return (int) $ultimoEvento->created_at->startOfDay()->diffInDays($ate->startOfDay());
        }

        return (int) $equipamento->data_entrada->diffInDays($ate);
    }
}
