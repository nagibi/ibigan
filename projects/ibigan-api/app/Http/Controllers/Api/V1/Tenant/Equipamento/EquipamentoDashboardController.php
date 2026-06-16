<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant\Equipamento;

use App\Http\Controllers\Controller;
use App\Models\Emprestimo;
use App\Models\Equipamento;
use App\Models\Manutencao;
use App\Services\EquipamentoDashboardGraficosService;
use Illuminate\Http\JsonResponse;

final class EquipamentoDashboardController extends Controller
{
    public function __construct(
        private readonly EquipamentoDashboardGraficosService $graficosService,
    ) {}

    public function resumo(): JsonResponse
    {
        $paradosQuery = Equipamento::query()->paradoHaMaisDe(30);

        return response()->json([
            'total' => Equipamento::query()->count(),
            'em_estoque' => Equipamento::query()->emEstoque()->count(),
            'em_utilizacao' => Equipamento::query()->emUtilizacao()->count(),
            'em_manutencao' => Equipamento::query()->emManutencao()->count(),
            'baixados' => Equipamento::query()->baixados()->count(),
            'perdidos' => Equipamento::query()->perdidos()->count(),
            'criticos' => Equipamento::query()->emEstoque()->where('is_critico', true)->count(),
            'parados_30_dias' => (clone $paradosQuery)->count(),
            'parados_30_dias_valor_mensal' => (float) (clone $paradosQuery)->sum('valor_mensal'),
        ]);
    }

    public function alertas(): JsonResponse
    {
        $ativos = Emprestimo::query()
            ->with(['equipamento.tipo', 'obra', 'renovacoes'])
            ->whereNull('data_devolucao')
            ->get();

        $vencidos = $ativos->filter(fn (Emprestimo $emprestimo) => $emprestimo->is_vencido);
        $proximos = $ativos->filter(fn (Emprestimo $emprestimo) => $emprestimo->is_proximo_vencimento && ! $emprestimo->is_vencido);
        $proximosSemana = $ativos->filter(function (Emprestimo $emprestimo) {
            if ($emprestimo->is_vencido) {
                return false;
            }

            $dias = $emprestimo->dias_ate_vencimento;

            return $dias >= 0 && $dias <= 7;
        });

        $manutencoesAtrasadas = Manutencao::query()
            ->with(['equipamento.tipo'])
            ->whereNull('data_saida')
            ->where('data_entrada', '<', now()->subDays(15)->toDateString())
            ->orderBy('data_entrada')
            ->get();

        $paradosQuery = Equipamento::query()
            ->with(['tipo', 'fornecedor'])
            ->emEstoque()
            ->paradoHaMaisDe(30);

        $paradosTotal = (clone $paradosQuery)->count();
        $paradosValorMensal = (float) (clone $paradosQuery)->sum('valor_mensal');

        $total = $vencidos->count()
            + $proximosSemana->count()
            + $manutencoesAtrasadas->count()
            + $paradosTotal;

        return response()->json([
            'total' => $total,
            'resumo' => [
                [
                    'id' => 'parados',
                    'total' => $paradosTotal,
                    'label' => $paradosTotal === 1
                        ? '1 equipamento parado há mais de 30 dias'
                        : "{$paradosTotal} equipamentos parados há mais de 30 dias",
                ],
                [
                    'id' => 'vencidos',
                    'total' => $vencidos->count(),
                    'label' => $vencidos->count() === 1
                        ? '1 empréstimo vencido'
                        : "{$vencidos->count()} empréstimos vencidos",
                ],
                [
                    'id' => 'manutencoes',
                    'total' => $manutencoesAtrasadas->count(),
                    'label' => $manutencoesAtrasadas->count() === 1
                        ? '1 manutenção parada há mais de 15 dias'
                        : "{$manutencoesAtrasadas->count()} manutenções paradas há mais de 15 dias",
                ],
                [
                    'id' => 'proximos_semana',
                    'total' => $proximosSemana->count(),
                    'label' => $proximosSemana->count() === 1
                        ? '1 empréstimo vence esta semana'
                        : "{$proximosSemana->count()} empréstimos vencem esta semana",
                ],
            ],
            'vencidos' => [
                'total' => $vencidos->count(),
                'itens' => $vencidos->map(fn (Emprestimo $emprestimo) => [
                    'emprestimo_id' => $emprestimo->id,
                    'equipamento_id' => $emprestimo->equipamento_id,
                    'patrimonio' => $emprestimo->equipamento->patrimonio,
                    'tipo' => $emprestimo->equipamento->tipo?->nome,
                    'colaborador' => $emprestimo->colaborador_nome,
                    'obra' => $emprestimo->obra?->codigo,
                    'data_retirada' => $emprestimo->data_retirada->format('d/m/Y'),
                    'data_vencimento' => $emprestimo->data_vencimento->format('d/m/Y'),
                    'dias_vencido' => abs($emprestimo->dias_ate_vencimento),
                ])->values(),
            ],
            'proximos_vencimento' => [
                'total' => $proximos->count(),
                'itens' => $proximos->map(fn (Emprestimo $emprestimo) => [
                    'emprestimo_id' => $emprestimo->id,
                    'equipamento_id' => $emprestimo->equipamento_id,
                    'patrimonio' => $emprestimo->equipamento->patrimonio,
                    'tipo' => $emprestimo->equipamento->tipo?->nome,
                    'colaborador' => $emprestimo->colaborador_nome,
                    'obra' => $emprestimo->obra?->codigo,
                    'data_vencimento' => $emprestimo->data_vencimento->format('d/m/Y'),
                    'dias_restantes' => $emprestimo->dias_ate_vencimento,
                ])->values(),
            ],
            'proximos_semana' => [
                'total' => $proximosSemana->count(),
                'itens' => $proximosSemana->map(fn (Emprestimo $emprestimo) => [
                    'emprestimo_id' => $emprestimo->id,
                    'equipamento_id' => $emprestimo->equipamento_id,
                    'patrimonio' => $emprestimo->equipamento->patrimonio,
                    'tipo' => $emprestimo->equipamento->tipo?->nome,
                    'colaborador' => $emprestimo->colaborador_nome,
                    'obra' => $emprestimo->obra?->codigo,
                    'data_vencimento' => $emprestimo->data_vencimento->format('d/m/Y'),
                    'dias_restantes' => $emprestimo->dias_ate_vencimento,
                ])->values(),
            ],
            'manutencoes_atrasadas' => [
                'total' => $manutencoesAtrasadas->count(),
                'itens' => $manutencoesAtrasadas->map(fn (Manutencao $manutencao) => [
                    'manutencao_id' => $manutencao->id,
                    'equipamento_id' => $manutencao->equipamento_id,
                    'patrimonio' => $manutencao->equipamento->patrimonio,
                    'tipo' => $manutencao->equipamento->tipo?->nome,
                    'motivo' => $manutencao->motivo,
                    'dias_em_manutencao' => $manutencao->dias_em_manutencao,
                    'data_entrada' => $manutencao->data_entrada->format('d/m/Y'),
                ])->values(),
            ],
            'equipamentos_parados' => [
                'total' => $paradosTotal,
                'valor_mensal_total' => $paradosValorMensal,
                'itens' => (clone $paradosQuery)
                    ->orderByDesc('valor_mensal')
                    ->limit(5)
                    ->get()
                    ->map(fn (Equipamento $equipamento) => [
                        'id' => $equipamento->id,
                        'patrimonio' => $equipamento->patrimonio,
                        'tipo' => $equipamento->tipo?->nome,
                        'fornecedor' => $equipamento->fornecedor?->nome,
                        'dias_parado' => $equipamento->tempo_em_estoque,
                        'valor_mensal' => (float) $equipamento->valor_mensal,
                    ])->values(),
            ],
        ]);
    }

    public function potencialDevolucao(): JsonResponse
    {
        $equipamentos = Equipamento::query()
            ->with(['tipo', 'fornecedor'])
            ->emEstoque()
            ->paradoHaMaisDe(30)
            ->orderByDesc('valor_mensal')
            ->get();

        return response()->json([
            'total' => $equipamentos->count(),
            'valor_mensal_total' => (float) $equipamentos->sum('valor_mensal'),
            'sugestoes' => $equipamentos->take(5)->map(function (Equipamento $equipamento) {
                $dias = $equipamento->tempo_em_estoque;
                $tipo = $equipamento->tipo?->nome ?? $equipamento->patrimonio;
                $valor = number_format((float) $equipamento->valor_mensal, 2, ',', '.');
                $fornecedor = $equipamento->fornecedor?->nome ?? 'locadora';

                return [
                    'id' => $equipamento->id,
                    'patrimonio' => $equipamento->patrimonio,
                    'tipo' => $equipamento->tipo?->nome,
                    'fornecedor' => $equipamento->fornecedor?->nome,
                    'dias_parado' => $dias,
                    'valor_mensal' => (float) $equipamento->valor_mensal,
                    'mensagem' => "{$tipo} está parado há {$dias} dias e possui custo mensal de R$ {$valor}. Considere devolução à {$fornecedor}.",
                ];
            })->values(),
        ]);
    }

    public function rankings(): JsonResponse
    {
        $maisUtilizados = Equipamento::query()
            ->withSum('emprestimos as total_dias', 'prazo_dias')
            ->with('tipo')
            ->orderByDesc('total_dias')
            ->limit(10)
            ->get()
            ->map(fn (Equipamento $equipamento) => [
                'patrimonio' => $equipamento->patrimonio,
                'tipo' => $equipamento->tipo?->nome,
                'total_dias' => $equipamento->total_dias ?? 0,
            ]);

        $maisManutencao = Equipamento::query()
            ->withCount('manutencoes')
            ->with('tipo')
            ->orderByDesc('manutencoes_count')
            ->limit(10)
            ->get()
            ->map(fn (Equipamento $equipamento) => [
                'patrimonio' => $equipamento->patrimonio,
                'tipo' => $equipamento->tipo?->nome,
                'total_manutencoes' => $equipamento->manutencoes_count,
            ]);

        $colaboradoresRanking = Emprestimo::query()
            ->get()
            ->groupBy(fn (Emprestimo $emprestimo) => $emprestimo->colaborador_nome.'|'.$emprestimo->colaborador_matricula)
            ->map(fn ($grupo) => [
                'colaborador_nome' => $grupo->first()->colaborador_nome,
                'colaborador_matricula' => $grupo->first()->colaborador_matricula,
                'total_emprestimos' => $grupo->count(),
                'media_dias' => round($grupo->avg(fn (Emprestimo $emprestimo) => $emprestimo->dias_em_uso), 2),
            ])
            ->sortByDesc('media_dias')
            ->take(10)
            ->values();

        return response()->json([
            'mais_utilizados' => $maisUtilizados,
            'mais_manutencao' => $maisManutencao,
            'colaboradores' => $colaboradoresRanking,
        ]);
    }

    public function financeiro(): JsonResponse
    {
        $fleetQuery = Equipamento::query()->whereDoesntHave('baixa');

        $custoMensalTotal = (float) (clone $fleetQuery)->sum('valor_mensal');

        $ociososQuery = Equipamento::query()->emEstoque()->paradoHaMaisDe(30);
        $ociososTotal = (clone $ociososQuery)->count();
        $ociososValorMensal = (float) (clone $ociososQuery)->sum('valor_mensal');

        $maisCaros = (clone $fleetQuery)
            ->with('tipo')
            ->orderByDesc('valor_mensal')
            ->limit(5)
            ->get()
            ->map(fn (Equipamento $equipamento) => [
                'patrimonio' => $equipamento->patrimonio,
                'tipo' => $equipamento->tipo?->nome,
                'valor_mensal' => (float) $equipamento->valor_mensal,
            ])
            ->values();

        $emprestimosAtivos = Emprestimo::query()
            ->with(['equipamento', 'obra', 'renovacoes'])
            ->whereNull('data_devolucao')
            ->get();

        $mapObraRanking = fn ($grupo) => [
            'obra_id' => $grupo->first()->obra_id,
            'codigo' => $grupo->first()->obra?->codigo,
            'nome' => $grupo->first()->obra?->nome,
            'total' => $grupo->count(),
            'valor_mensal' => round($grupo->sum(
                fn (Emprestimo $emprestimo) => (float) $emprestimo->equipamento->valor_mensal
            ), 2),
        ];

        $obrasMaiorConsumo = $emprestimosAtivos
            ->groupBy('obra_id')
            ->map($mapObraRanking)
            ->sortByDesc('valor_mensal')
            ->values()
            ->take(5);

        $parados = Equipamento::query()
            ->with('obra')
            ->emEstoque()
            ->paradoHaMaisDe(30)
            ->get();

        $obrasMaisParados = $parados
            ->groupBy('obra_id')
            ->map(fn ($grupo) => [
                'obra_id' => $grupo->first()->obra_id,
                'codigo' => $grupo->first()->obra?->codigo,
                'nome' => $grupo->first()->obra?->nome,
                'total' => $grupo->count(),
                'valor_mensal' => round($grupo->sum(fn (Equipamento $equipamento) => (float) $equipamento->valor_mensal), 2),
            ])
            ->sortByDesc('valor_mensal')
            ->values()
            ->take(5);

        $obrasMaisVencidos = $emprestimosAtivos
            ->filter(fn (Emprestimo $emprestimo) => $emprestimo->is_vencido)
            ->groupBy('obra_id')
            ->map(fn ($grupo) => [
                'obra_id' => $grupo->first()->obra_id,
                'codigo' => $grupo->first()->obra?->codigo,
                'nome' => $grupo->first()->obra?->nome,
                'total' => $grupo->count(),
                'valor_mensal' => round($grupo->sum(
                    fn (Emprestimo $emprestimo) => (float) $emprestimo->equipamento->valor_mensal
                ), 2),
            ])
            ->sortByDesc('total')
            ->values()
            ->take(5);

        $colaboradoresAtivos = $emprestimosAtivos
            ->groupBy(fn (Emprestimo $emprestimo) => $emprestimo->colaborador_nome.'|'.$emprestimo->colaborador_matricula)
            ->map(fn ($grupo) => [
                'colaborador_nome' => $grupo->first()->colaborador_nome,
                'colaborador_matricula' => $grupo->first()->colaborador_matricula,
                'total_emprestimos_ativos' => $grupo->count(),
                'total_renovacoes' => $grupo->sum(fn (Emprestimo $emprestimo) => $emprestimo->renovacoes->count()),
                'media_dias_em_uso' => round($grupo->avg(fn (Emprestimo $emprestimo) => $emprestimo->dias_em_uso), 1),
            ]);

        $mediaEmprestimosPorColaborador = $colaboradoresAtivos->isEmpty()
            ? 0
            : round($colaboradoresAtivos->avg('total_emprestimos_ativos'), 1);

        $colaboradoresExcesso = $colaboradoresAtivos
            ->filter(fn (array $item) => $item['total_emprestimos_ativos'] > max($mediaEmprestimosPorColaborador, 1))
            ->sortByDesc('total_emprestimos_ativos')
            ->values()
            ->take(5);

        $colaboradoresMaisRenovacoes = $colaboradoresAtivos
            ->sortByDesc('total_renovacoes')
            ->values()
            ->take(5);

        $colaboradoresMaisTempo = $colaboradoresAtivos
            ->sortByDesc('media_dias_em_uso')
            ->values()
            ->take(5);

        $maisManutencao = Equipamento::query()
            ->withCount('manutencoes')
            ->with('tipo')
            ->whereDoesntHave('baixa')
            ->orderByDesc('manutencoes_count')
            ->limit(3)
            ->get();

        $recomendacoes = [];

        if ($ociososTotal > 0) {
            $recomendacoes[] = [
                'id' => 'devolver',
                'icone' => 'trending-down',
                'titulo' => "Devolver {$ociososTotal} equipamento".($ociososTotal === 1 ? '' : 's'),
                'descricao' => 'Equipamentos parados há mais de 30 dias no estoque.',
                'economia_mensal' => $ociososValorMensal,
            ];
        }

        $equipamentoProblematico = $maisManutencao->first(fn (Equipamento $equipamento) => $equipamento->manutencoes_count >= 3);

        if ($equipamentoProblematico) {
            $recomendacoes[] = [
                'id' => 'substituir',
                'icone' => 'wrench',
                'titulo' => 'Substituir '.$equipamentoProblematico->tipo?->nome,
                'descricao' => "{$equipamentoProblematico->manutencoes_count} manutenções registradas — pode indicar mau uso ou desgaste.",
                'patrimonio' => $equipamentoProblematico->patrimonio,
            ];
        }

        if ($ociososValorMensal > 0) {
            $recomendacoes[] = [
                'id' => 'economia',
                'icone' => 'chart',
                'titulo' => 'Reduzir custo de ociosidade',
                'descricao' => 'Potencial de devolução à locadora ou realocação entre obras.',
                'economia_mensal' => $ociososValorMensal,
            ];
        }

        return response()->json([
            'custo_mensal_total' => $custoMensalTotal,
            'equipamentos_ociosos' => [
                'total' => $ociososTotal,
                'valor_mensal' => $ociososValorMensal,
            ],
            'economia_potencial_mensal' => $ociososValorMensal,
            'equipamentos_mais_caros' => $maisCaros,
            'obras' => [
                'maior_consumo' => $obrasMaiorConsumo,
                'mais_parados' => $obrasMaisParados,
                'mais_vencidos' => $obrasMaisVencidos,
            ],
            'colaboradores' => [
                'media_emprestimos_ativos' => $mediaEmprestimosPorColaborador,
                'mais_tempo' => $colaboradoresMaisTempo,
                'mais_renovacoes' => $colaboradoresMaisRenovacoes,
                'excesso_equipamentos' => $colaboradoresExcesso,
            ],
            'recomendacoes' => $recomendacoes,
        ]);
    }

    public function graficos(): JsonResponse
    {
        return response()->json($this->graficosService->gerar());
    }
}
