<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant\Equipamento;

use App\Http\Controllers\Api\V1\Tenant\Equipamento\Concerns\AppliesEquipamentoCatalogGrid;
use App\Http\Controllers\Api\V1\Tenant\Equipamento\Concerns\RespondsWithPagination;
use App\Http\Controllers\Controller;
use App\Models\Obra;
use App\Models\User;
use App\Support\ApiResponse;
use App\Support\GridFilter;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response;

final class ObraController extends Controller
{
    use AppliesEquipamentoCatalogGrid;
    use RespondsWithPagination;

    public function lookup(Request $request): JsonResponse
    {
        $obras = Obra::query()
            ->where('is_ativa', true)
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = $request->string('search')->toString();
                $query->where(function ($q) use ($search) {
                    $q->where('codigo', 'like', "%{$search}%")
                        ->orWhere('nome', 'like', "%{$search}%");
                });
            })
            ->orderBy('codigo')
            ->limit($request->integer('limit', 50))
            ->get(['id', 'codigo', 'nome']);

        return ApiResponse::success($obras);
    }

    public function index(Request $request): JsonResponse
    {
        $query = Obra::query()
            ->with('responsavelUser:id,name,email')
            ->when($request->filled('search'), function (Builder $q) use ($request) {
                $search = $request->string('search')->toString();
                $q->where(function (Builder $inner) use ($search) {
                    $inner->where('codigo', 'like', "%{$search}%")
                        ->orWhere('nome', 'like', "%{$search}%");
                });
            })
            ->when(
                $request->filled('filter_id'),
                fn (Builder $q) => GridFilter::applyIdFromCsv($q, $request->string('filter_id')->toString()),
            )
            ->when(
                $request->filled('filter_codigo'),
                fn (Builder $q) => $q->where('codigo', 'like', '%'.$request->string('filter_codigo')->toString().'%'),
            )
            ->when(
                $request->filled('filter_nome'),
                fn (Builder $q) => $q->where('nome', 'like', '%'.$request->string('filter_nome')->toString().'%'),
            )
            ->when(
                $request->filled('filter_endereco'),
                fn (Builder $q) => $q->where('endereco', 'like', '%'.$request->string('filter_endereco')->toString().'%'),
            )
            ->when(
                $request->filled('filter_responsavel'),
                fn (Builder $q) => $q->where(function (Builder $inner) use ($request) {
                    $search = '%'.$request->string('filter_responsavel')->toString().'%';
                    $inner->where('responsavel', 'like', $search)
                        ->orWhereHas(
                            'responsavelUser',
                            fn (Builder $userQuery) => $userQuery
                                ->where('name', 'like', $search)
                                ->orWhere('email', 'like', $search),
                        );
                }),
            )
            ->when(
                $request->filled('filter_is_ativa'),
                fn (Builder $q) => GridFilter::applyWhereInFromCsv($q, 'is_ativa', $request->string('filter_is_ativa')->toString()),
            );

        $obras = $this->applyCatalogSort(
            $this->applyCatalogAuditDateFilters($query, $request),
            $request,
            ['id', 'codigo', 'nome', 'endereco', 'responsavel', 'is_ativa', 'created_at', 'updated_at'],
            'codigo',
        )->paginate($request->integer('per_page', 15));

        return $this->paginated($obras, fn (Obra $obra) => $this->serialize($obra));
    }

    public function show(Obra $obra): JsonResponse
    {
        $obra->load('responsavelUser:id,name,email');

        return ApiResponse::success($this->serialize($obra));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'codigo' => ['required', 'string', 'max:50', Rule::unique('obras', 'codigo')],
            'nome' => ['required', 'string', 'max:255'],
            'endereco' => ['nullable', 'string', 'max:255'],
            'responsavel_user_id' => ['nullable', 'integer', Rule::exists('users', 'id')],
            'is_ativa' => ['sometimes', 'boolean'],
        ]);

        $this->applyResponsavelUser($data);

        $obra = Obra::query()->create($data);

        return ApiResponse::success($this->serialize($obra->load('responsavelUser:id,name,email')), 'MSG000424', httpStatus: Response::HTTP_CREATED);
    }

    public function update(Request $request, Obra $obra): JsonResponse
    {
        $data = $request->validate([
            'codigo' => ['sometimes', 'string', 'max:50', Rule::unique('obras', 'codigo')->ignore($obra->id)],
            'nome' => ['sometimes', 'required', 'string', 'max:255'],
            'endereco' => ['nullable', 'string', 'max:255'],
            'responsavel_user_id' => ['nullable', 'integer', Rule::exists('users', 'id')],
            'is_ativa' => ['sometimes', 'boolean'],
        ]);

        $this->applyResponsavelUser($data);

        $obra->update($data);

        return ApiResponse::success($this->serialize($obra->fresh()->load('responsavelUser:id,name,email')));
    }

    public function destroy(Obra $obra): JsonResponse
    {
        $obra->delete();

        return ApiResponse::success(null, 'MSG000426');
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function applyResponsavelUser(array &$data): void
    {
        if (! array_key_exists('responsavel_user_id', $data)) {
            return;
        }

        $userId = $data['responsavel_user_id'];
        $data['responsavel'] = $userId
            ? User::query()->whereKey($userId)->value('name')
            : null;
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(Obra $obra): array
    {
        return [
            'id' => $obra->id,
            'codigo' => $obra->codigo,
            'nome' => $obra->nome,
            'endereco' => $obra->endereco,
            'responsavel_user_id' => $obra->responsavel_user_id,
            'responsavel' => $obra->responsavel ?? $obra->responsavelUser?->name,
            'responsavel_user' => $obra->relationLoaded('responsavelUser') && $obra->responsavelUser
                ? [
                    'id' => $obra->responsavelUser->id,
                    'name' => $obra->responsavelUser->name,
                    'email' => $obra->responsavelUser->email,
                ]
                : null,
            'is_ativa' => $obra->is_ativa,
            'created_at' => $obra->created_at?->toIso8601String(),
            'updated_at' => $obra->updated_at?->toIso8601String(),
        ];
    }
}
