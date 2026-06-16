<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant\Equipamento;

use App\Http\Controllers\Api\V1\Tenant\Equipamento\Concerns\AppliesEquipamentoCatalogGrid;
use App\Http\Controllers\Api\V1\Tenant\Equipamento\Concerns\RespondsWithPagination;
use App\Http\Controllers\Controller;
use App\Models\GrupoEquipamento;
use App\Models\TipoEquipamento;
use App\Support\ApiResponse;
use App\Support\GridFilter;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response;

final class TipoEquipamentoController extends Controller
{
    use AppliesEquipamentoCatalogGrid;
    use RespondsWithPagination;

    public function lookup(Request $request): JsonResponse
    {
        $tipos = TipoEquipamento::query()
            ->with('grupo:id,nome')
            ->where('is_ativo', true)
            ->when($request->filled('grupo_id'), fn ($query) => $query->where('grupo_id', $request->integer('grupo_id')))
            ->when($request->filled('search'), fn ($query) => $query->where('nome', 'like', '%'.$request->string('search').'%'))
            ->orderBy('nome')
            ->limit($request->integer('limit', 50))
            ->get(['id', 'grupo_id', 'nome']);

        return ApiResponse::success($tipos);
    }

    public function index(Request $request): JsonResponse
    {
        $query = TipoEquipamento::query()
            ->with('grupo:id,nome')
            ->when($request->filled('grupo_id'), fn (Builder $q) => $q->where('grupo_id', $request->integer('grupo_id')))
            ->when($request->filled('search'), fn (Builder $q) => $q->where('nome', 'like', '%'.$request->string('search').'%'))
            ->when(
                $request->filled('filter_id'),
                fn (Builder $q) => GridFilter::applyIdFromCsv($q, $request->string('filter_id')->toString()),
            )
            ->when(
                $request->filled('filter_nome'),
                fn (Builder $q) => $q->where('nome', 'like', '%'.$request->string('filter_nome')->toString().'%'),
            )
            ->when(
                $request->filled('filter_grupo'),
                fn (Builder $q) => $q->whereHas(
                    'grupo',
                    fn (Builder $grupoQuery) => $grupoQuery->where('nome', 'like', '%'.$request->string('filter_grupo')->toString().'%'),
                ),
            )
            ->when(
                $request->filled('filter_is_ativo'),
                fn (Builder $q) => GridFilter::applyWhereInFromCsv($q, 'is_ativo', $request->string('filter_is_ativo')->toString()),
            );

        $tipos = $this->applyCatalogSort(
            $this->applyCatalogAuditDateFilters($query, $request),
            $request,
            ['id', 'nome', 'is_ativo', 'created_at', 'updated_at'],
            'nome',
            function (Builder $query, string $sort, string $direction): ?Builder {
                if ($sort !== 'grupo') {
                    return null;
                }

                return $query->orderBy(
                    GrupoEquipamento::query()
                        ->select('grupos_equipamento.nome')
                        ->whereColumn('grupos_equipamento.id', 'tipos_equipamento.grupo_id')
                        ->limit(1),
                    $direction,
                );
            },
        )->paginate($request->integer('per_page', 15));

        return $this->paginated($tipos, fn (TipoEquipamento $tipo) => $this->serialize($tipo));
    }

    public function show(TipoEquipamento $tipo): JsonResponse
    {
        $tipo->load('grupo');

        return ApiResponse::success($this->serialize($tipo));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'grupo_id' => ['required', 'integer', Rule::exists('grupos_equipamento', 'id')],
            'nome' => ['required', 'string', 'max:255'],
            'is_ativo' => ['sometimes', 'boolean'],
        ]);

        $tipo = TipoEquipamento::query()->create($data);

        return ApiResponse::success($this->serialize($tipo->load('grupo')), 'MSG000424', httpStatus: Response::HTTP_CREATED);
    }

    public function update(Request $request, TipoEquipamento $tipo): JsonResponse
    {
        $data = $request->validate([
            'grupo_id' => ['sometimes', 'integer', Rule::exists('grupos_equipamento', 'id')],
            'nome' => ['sometimes', 'string', 'max:255'],
            'is_ativo' => ['sometimes', 'boolean'],
        ]);

        $tipo->update($data);

        return ApiResponse::success($this->serialize($tipo->fresh()->load('grupo')));
    }

    public function destroy(TipoEquipamento $tipo): JsonResponse
    {
        $tipo->delete();

        return ApiResponse::success(null, 'MSG000426');
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(TipoEquipamento $tipo): array
    {
        return [
            'id' => $tipo->id,
            'grupo_id' => $tipo->grupo_id,
            'grupo' => $tipo->relationLoaded('grupo') ? [
                'id' => $tipo->grupo->id,
                'nome' => $tipo->grupo->nome,
            ] : null,
            'nome' => $tipo->nome,
            'is_ativo' => $tipo->is_ativo,
            'created_at' => $tipo->created_at?->toIso8601String(),
            'updated_at' => $tipo->updated_at?->toIso8601String(),
        ];
    }
}
