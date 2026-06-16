<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant\Equipamento;

use App\Http\Controllers\Api\V1\Tenant\Equipamento\Concerns\RespondsWithPagination;
use App\Http\Controllers\Controller;
use App\Http\Requests\Baixa\StoreBaixaRequest;
use App\Models\Baixa;
use App\Models\Equipamento;
use App\Services\EquipamentoStatusService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class BaixaController extends Controller
{
    use RespondsWithPagination;

    public function __construct(
        private readonly EquipamentoStatusService $statusService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $baixas = Baixa::query()
            ->with(['equipamento', 'registradoPor:id,name'])
            ->when($request->filled('tipo'), fn ($query) => $query->where('tipo', $request->string('tipo')->toString()))
            ->when($request->filled('equipamento_id'), fn ($query) => $query->where('equipamento_id', $request->integer('equipamento_id')))
            ->latest('data_baixa')
            ->paginate($request->integer('per_page', 15));

        return $this->paginated($baixas, fn (Baixa $baixa) => $this->serialize($baixa));
    }

    public function store(StoreBaixaRequest $request, Equipamento $equipamento): JsonResponse
    {
        $baixa = $this->statusService->baixar($equipamento, $request->validated());
        $baixa->load(['equipamento']);

        return ApiResponse::success($this->serialize($baixa), 'MSG000424', httpStatus: Response::HTTP_CREATED);
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(Baixa $baixa): array
    {
        return [
            'id' => $baixa->id,
            'equipamento_id' => $baixa->equipamento_id,
            'equipamento' => $baixa->relationLoaded('equipamento') && $baixa->equipamento ? [
                'id' => $baixa->equipamento->id,
                'patrimonio' => $baixa->equipamento->patrimonio,
            ] : null,
            'tipo' => $baixa->tipo,
            'data_baixa' => $baixa->data_baixa->toDateString(),
            'motivo' => $baixa->motivo,
            'foto_path' => $baixa->foto_path,
            'responsavel_perda' => $baixa->responsavel_perda,
            'valor_reposicao' => $baixa->valor_reposicao,
            'observacoes' => $baixa->observacoes,
            'registrado_por' => $baixa->relationLoaded('registradoPor') && $baixa->registradoPor ? [
                'id' => $baixa->registradoPor->id,
                'name' => $baixa->registradoPor->name,
            ] : null,
            'created_at' => $baixa->created_at?->toIso8601String(),
        ];
    }
}
