<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant\Equipamento;

use App\Http\Controllers\Api\V1\Tenant\Equipamento\Concerns\RespondsWithPagination;
use App\Http\Controllers\Controller;
use App\Http\Requests\Manutencao\StoreManutencaoRequest;
use App\Models\Equipamento;
use App\Models\Manutencao;
use App\Services\EquipamentoStatusService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class ManutencaoController extends Controller
{
    use RespondsWithPagination;

    public function __construct(
        private readonly EquipamentoStatusService $statusService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $manutencoes = Manutencao::query()
            ->with(['equipamento', 'emprestimo'])
            ->when($request->boolean('ativas'), fn ($query) => $query->whereNull('data_saida'))
            ->when($request->filled('equipamento_id'), fn ($query) => $query->where('equipamento_id', $request->integer('equipamento_id')))
            ->when($request->filled('responsabilidade'), fn ($query) => $query->where('responsabilidade', $request->string('responsabilidade')->toString()))
            ->latest('data_entrada')
            ->paginate($request->integer('per_page', 15));

        return $this->paginated($manutencoes, fn (Manutencao $manutencao) => $this->serialize($manutencao));
    }

    public function show(Manutencao $manutencao): JsonResponse
    {
        $manutencao->load(['equipamento.tipo', 'emprestimo', 'registradoPor:id,name']);

        return ApiResponse::success($this->serialize($manutencao, detailed: true));
    }

    public function store(StoreManutencaoRequest $request, Equipamento $equipamento): JsonResponse
    {
        $manutencao = $this->statusService->enviarParaManutencao($equipamento, $request->validated());
        $manutencao->load(['equipamento', 'emprestimo']);

        return ApiResponse::success($this->serialize($manutencao), 'MSG000424', httpStatus: Response::HTTP_CREATED);
    }

    public function finalizar(Request $request, Manutencao $manutencao): JsonResponse
    {
        $data = $request->validate([
            'data_saida' => ['nullable', 'date', 'before_or_equal:today'],
        ]);

        $manutencao = $this->statusService->finalizarManutencao($manutencao, $data);
        $manutencao->load(['equipamento']);

        return ApiResponse::success($this->serialize($manutencao));
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(Manutencao $manutencao, bool $detailed = false): array
    {
        $data = [
            'id' => $manutencao->id,
            'equipamento_id' => $manutencao->equipamento_id,
            'equipamento' => $manutencao->relationLoaded('equipamento') && $manutencao->equipamento ? [
                'id' => $manutencao->equipamento->id,
                'patrimonio' => $manutencao->equipamento->patrimonio,
            ] : null,
            'origem' => $manutencao->origem,
            'emprestimo_id' => $manutencao->emprestimo_id,
            'responsabilidade' => $manutencao->responsabilidade,
            'motivo' => $manutencao->motivo,
            'responsavel_manutencao' => $manutencao->responsavel_manutencao,
            'valor_mensal_snapshot' => $manutencao->valor_mensal_snapshot,
            'desconto_medicao' => $manutencao->desconto_medicao,
            'data_entrada' => $manutencao->data_entrada->toDateString(),
            'data_saida' => $manutencao->data_saida?->toDateString(),
            'ativa' => $manutencao->data_saida === null,
            'dias_em_manutencao' => $manutencao->dias_em_manutencao,
            'created_at' => $manutencao->created_at?->toIso8601String(),
        ];

        if ($detailed) {
            $data['observacoes_tecnicas'] = $manutencao->observacoes_tecnicas;
            $data['foto_path'] = $manutencao->foto_path;
            $data['registrado_por'] = $manutencao->relationLoaded('registradoPor') && $manutencao->registradoPor ? [
                'id' => $manutencao->registradoPor->id,
                'name' => $manutencao->registradoPor->name,
            ] : null;
        }

        return $data;
    }
}
