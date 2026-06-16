<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant\Equipamento;

use App\Http\Controllers\Api\V1\Tenant\Equipamento\Concerns\RespondsWithPagination;
use App\Http\Controllers\Controller;
use App\Models\Equipamento;
use App\Models\HistoricoEquipamento;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class HistoricoController extends Controller
{
    use RespondsWithPagination;

    public function index(Request $request, Equipamento $equipamento): JsonResponse
    {
        $historico = $equipamento->historico()
            ->with('registradoPor:id,name')
            ->when($request->filled('evento'), fn ($query) => $query->where('evento', $request->string('evento')->toString()))
            ->paginate($request->integer('per_page', 20));

        return $this->paginated($historico, fn (HistoricoEquipamento $item) => [
            'id' => $item->id,
            'evento' => $item->evento,
            'dados' => $item->dados,
            'status_resultante' => $item->status_resultante,
            'observacao' => $item->observacao,
            'registrado_por' => $item->relationLoaded('registradoPor') && $item->registradoPor ? [
                'id' => $item->registradoPor->id,
                'name' => $item->registradoPor->name,
            ] : null,
            'created_at' => $item->created_at?->toIso8601String(),
        ]);
    }
}
