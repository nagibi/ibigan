<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant\Equipamento;

use App\Http\Controllers\Api\V1\Tenant\Equipamento\Concerns\RespondsWithPagination;
use App\Http\Controllers\Controller;
use App\Models\GrupoEquipamento;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response;

final class GrupoEquipamentoController extends Controller
{
    use RespondsWithPagination;

    public function lookup(Request $request): JsonResponse
    {
        $grupos = GrupoEquipamento::query()
            ->when($request->filled('search'), fn ($query) => $query->where('nome', 'like', '%'.$request->string('search').'%'))
            ->orderBy('nome')
            ->limit($request->integer('limit', 50))
            ->get(['id', 'nome']);

        return ApiResponse::success($grupos);
    }

    public function index(Request $request): JsonResponse
    {
        $grupos = GrupoEquipamento::query()
            ->withCount('tipos')
            ->when($request->filled('search'), fn ($query) => $query->where('nome', 'like', '%'.$request->string('search').'%'))
            ->orderBy('nome')
            ->paginate($request->integer('per_page', 15));

        return $this->paginated($grupos, fn (GrupoEquipamento $grupo) => $this->serialize($grupo));
    }

    public function show(GrupoEquipamento $grupo): JsonResponse
    {
        $grupo->load('tipos');

        return ApiResponse::success($this->serialize($grupo, includeTipos: true));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nome' => ['required', 'string', 'max:255', Rule::unique('grupos_equipamento', 'nome')],
        ]);

        $grupo = GrupoEquipamento::query()->create($data);

        return ApiResponse::success($this->serialize($grupo), 'MSG000424', httpStatus: Response::HTTP_CREATED);
    }

    public function update(Request $request, GrupoEquipamento $grupo): JsonResponse
    {
        $data = $request->validate([
            'nome' => ['sometimes', 'string', 'max:255', Rule::unique('grupos_equipamento', 'nome')->ignore($grupo->id)],
        ]);

        $grupo->update($data);

        return ApiResponse::success($this->serialize($grupo->fresh()));
    }

    public function destroy(GrupoEquipamento $grupo): JsonResponse
    {
        $grupo->delete();

        return ApiResponse::success(null, 'MSG000426');
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(GrupoEquipamento $grupo, bool $includeTipos = false): array
    {
        $data = [
            'id' => $grupo->id,
            'nome' => $grupo->nome,
            'tipos_count' => $grupo->tipos_count ?? $grupo->tipos()->count(),
            'created_at' => $grupo->created_at?->toIso8601String(),
            'updated_at' => $grupo->updated_at?->toIso8601String(),
        ];

        if ($includeTipos) {
            $data['tipos'] = $grupo->tipos->map(fn ($tipo) => [
                'id' => $tipo->id,
                'nome' => $tipo->nome,
            ])->values()->all();
        }

        return $data;
    }
}
