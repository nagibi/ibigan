<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant\Equipamento;

use App\Http\Controllers\Api\V1\Tenant\Equipamento\Concerns\AppliesEquipamentoCatalogGrid;
use App\Http\Controllers\Api\V1\Tenant\Equipamento\Concerns\RespondsWithPagination;
use App\Http\Controllers\Controller;
use App\Models\Fornecedor;
use App\Support\ApiResponse;
use App\Support\GridFilter;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class FornecedorController extends Controller
{
    use AppliesEquipamentoCatalogGrid;
    use RespondsWithPagination;

    public function lookup(Request $request): JsonResponse
    {
        $fornecedores = Fornecedor::query()
            ->where('is_ativo', true)
            ->when($request->filled('search'), fn ($query) => $query->where('nome', 'like', '%'.$request->string('search').'%'))
            ->orderBy('nome')
            ->limit($request->integer('limit', 50))
            ->get(['id', 'nome', 'cnpj']);

        return ApiResponse::success($fornecedores);
    }

    public function index(Request $request): JsonResponse
    {
        $query = Fornecedor::query()
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
                $request->filled('filter_cnpj'),
                fn (Builder $q) => $q->where('cnpj', 'like', '%'.preg_replace('/\D+/', '', $request->string('filter_cnpj')->toString()).'%'),
            )
            ->when(
                $request->filled('filter_telefone'),
                fn (Builder $q) => $q->where('telefone', 'like', '%'.preg_replace('/\D+/', '', $request->string('filter_telefone')->toString()).'%'),
            )
            ->when(
                $request->filled('filter_email'),
                fn (Builder $q) => $q->where('email', 'like', '%'.$request->string('filter_email')->toString().'%'),
            )
            ->when(
                $request->filled('filter_contato_responsavel'),
                fn (Builder $q) => $q->where('contato_responsavel', 'like', '%'.$request->string('filter_contato_responsavel')->toString().'%'),
            )
            ->when(
                $request->filled('filter_is_ativo'),
                fn (Builder $q) => GridFilter::applyWhereInFromCsv($q, 'is_ativo', $request->string('filter_is_ativo')->toString()),
            );

        $fornecedores = $this->applyCatalogSort(
            $this->applyCatalogAuditDateFilters($query, $request),
            $request,
            ['id', 'nome', 'cnpj', 'telefone', 'email', 'contato_responsavel', 'is_ativo', 'created_at', 'updated_at'],
            'nome',
        )->paginate($request->integer('per_page', 15));

        return $this->paginated($fornecedores, fn (Fornecedor $fornecedor) => $this->serialize($fornecedor));
    }

    public function show(Fornecedor $fornecedor): JsonResponse
    {
        return ApiResponse::success($this->serialize($fornecedor));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nome' => ['required', 'string', 'max:255'],
            'cnpj' => ['nullable', 'string', 'max:18'],
            'telefone' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:255'],
            'contato_responsavel' => ['nullable', 'string', 'max:150'],
            'is_ativo' => ['sometimes', 'boolean'],
        ]);

        $fornecedor = Fornecedor::query()->create($data);

        return ApiResponse::success($this->serialize($fornecedor), 'MSG000424', httpStatus: Response::HTTP_CREATED);
    }

    public function update(Request $request, Fornecedor $fornecedor): JsonResponse
    {
        $data = $request->validate([
            'nome' => ['sometimes', 'string', 'max:255'],
            'cnpj' => ['nullable', 'string', 'max:18'],
            'telefone' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:255'],
            'contato_responsavel' => ['nullable', 'string', 'max:150'],
            'is_ativo' => ['sometimes', 'boolean'],
        ]);

        $fornecedor->update($data);

        return ApiResponse::success($this->serialize($fornecedor->fresh()));
    }

    public function destroy(Fornecedor $fornecedor): JsonResponse
    {
        $fornecedor->delete();

        return ApiResponse::success(null, 'MSG000426');
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(Fornecedor $fornecedor): array
    {
        return [
            'id' => $fornecedor->id,
            'nome' => $fornecedor->nome,
            'cnpj' => $fornecedor->cnpj,
            'telefone' => $fornecedor->telefone,
            'email' => $fornecedor->email,
            'contato_responsavel' => $fornecedor->contato_responsavel,
            'is_ativo' => $fornecedor->is_ativo,
            'created_at' => $fornecedor->created_at?->toIso8601String(),
            'updated_at' => $fornecedor->updated_at?->toIso8601String(),
        ];
    }
}
