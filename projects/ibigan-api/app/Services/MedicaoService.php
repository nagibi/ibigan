<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Equipamento;
use Carbon\Carbon;
use Illuminate\Support\Collection;

final class MedicaoService
{
    /**
     * Gera relatório de medição para um período específico.
     *
     * Para cada equipamento, calcula:
     * - Dias totais no período em que estava locado (não baixado/perdido)
     * - Dias em manutenção por falha do equipamento (desconto)
     * - Dias faturáveis = dias totais - dias de desconto
     * - Valor proporcional = dias faturáveis * valor_diario
     *
     * @param  array<string, mixed>  $filtros  ['fornecedor_id', 'obra_id', 'tipo_id', 'incluir_baixados']
     * @return array<string, mixed>
     */
    public function calcular(Carbon $dataInicio, Carbon $dataFim, array $filtros = []): array
    {
        $diasPeriodo = $dataInicio->diffInDays($dataFim) + 1;

        $query = Equipamento::with([
            'tipo.grupo',
            'fornecedor',
            'obra',
            'emprestimoAtivo',
            'manutencaoAtiva',
            'emprestimos' => fn ($q) => $q
                ->where('data_retirada', '<=', $dataFim)
                ->where(fn ($q2) => $q2->whereNull('data_devolucao')->orWhere('data_devolucao', '>=', $dataInicio)),
            'manutencoes' => fn ($q) => $q
                ->noPeriodo($dataInicio, $dataFim)
                ->comDesconto(),
            'baixa',
        ]);

        if (! empty($filtros['fornecedor_id'])) {
            $query->where('fornecedor_id', $filtros['fornecedor_id']);
        }
        if (! empty($filtros['obra_id'])) {
            $query->where('obra_id', $filtros['obra_id']);
        }
        if (! empty($filtros['tipo_id'])) {
            $query->where('tipo_id', $filtros['tipo_id']);
        }

        $equipamentos = $query->get();

        $itens = $equipamentos->map(function (Equipamento $eq) use ($dataInicio, $dataFim, $filtros) {
            $baixado = $eq->baixa && Carbon::parse($eq->baixa->data_baixa)->lt($dataInicio);

            if ($baixado && empty($filtros['incluir_baixados'])) {
                return null;
            }

            $inicioEfetivo = $dataInicio->copy()->max($eq->data_entrada);
            $fimEfetivo = $dataFim->copy();

            if ($eq->baixa) {
                $fimEfetivo = $fimEfetivo->min(Carbon::parse($eq->baixa->data_baixa));
            }

            if ($inicioEfetivo->gt($fimEfetivo)) {
                return null;
            }

            $diasEfetivos = $inicioEfetivo->diffInDays($fimEfetivo) + 1;

            $diasDesconto = 0;
            foreach ($eq->manutencoes as $man) {
                $manInicio = $inicioEfetivo->copy()->max($man->data_entrada);
                $manFim = $fimEfetivo->copy();

                if ($man->data_saida) {
                    $manFim = $manFim->min($man->data_saida);
                }

                if ($manInicio->lte($manFim)) {
                    $diasDesconto += $manInicio->diffInDays($manFim) + 1;
                }
            }

            $diasFaturaveis = max(0, $diasEfetivos - $diasDesconto);
            $valorDiario = round((float) $eq->valor_mensal / 30, 4);
            $valorProporcional = round($diasFaturaveis * $valorDiario, 2);

            return [
                'equipamento_id' => $eq->id,
                'patrimonio' => $eq->patrimonio,
                'tipo' => $eq->tipo->nome ?? '',
                'grupo' => $eq->tipo->grupo->nome ?? '',
                'fornecedor' => $eq->fornecedor->nome ?? '',
                'obra' => $eq->obra->codigo ?? '',
                'valor_mensal' => $eq->valor_mensal,
                'valor_diario' => $valorDiario,
                'dias_periodo' => $diasEfetivos,
                'dias_desconto' => $diasDesconto,
                'dias_faturáveis' => $diasFaturaveis,
                'valor_proporcional' => $valorProporcional,
                'status' => $eq->status,
                'manutencoes' => $eq->manutencoes->map(fn ($m) => [
                    'data_entrada' => $m->data_entrada,
                    'data_saida' => $m->data_saida,
                    'responsabilidade' => $m->responsabilidade,
                    'desconto_dias' => $m->dias_desconto_medicao,
                ])->values(),
            ];
        })->filter()->values();

        $totais = [
            'quantidade_equipamentos' => $itens->count(),
            'total_dias_faturáveis' => $itens->sum('dias_faturáveis'),
            'total_desconto_dias' => $itens->sum('dias_desconto'),
            'valor_total' => $itens->sum('valor_proporcional'),
        ];

        return [
            'periodo' => [
                'inicio' => $dataInicio->toDateString(),
                'fim' => $dataFim->toDateString(),
                'dias' => $diasPeriodo,
            ],
            'totais' => $totais,
            'itens' => $itens,
        ];
    }

    /**
     * @param  array<string, mixed>  $resultado
     * @return array<string, mixed>
     */
    public function agruparPorFornecedor(array $resultado): array
    {
        /** @var Collection<int, array<string, mixed>> $itens */
        $itens = collect($resultado['itens']);

        $grupos = $itens
            ->groupBy('fornecedor')
            ->map(fn (Collection $grupo, string $fornecedor) => [
                'fornecedor' => $fornecedor,
                'quantidade' => $grupo->count(),
                'valor_total' => $grupo->sum('valor_proporcional'),
                'equipamentos' => $grupo->values(),
            ])
            ->values();

        return [
            'periodo' => $resultado['periodo'],
            'totais' => $resultado['totais'],
            'grupos' => $grupos,
        ];
    }
}
