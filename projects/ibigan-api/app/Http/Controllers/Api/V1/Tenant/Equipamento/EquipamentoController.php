<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant\Equipamento;

use App\Http\Controllers\Controller;
use App\Http\Requests\Equipamento\StoreEquipamentoRequest;
use App\Http\Requests\ToggleActiveRequest;
use App\Http\Resources\Equipamento\EquipamentoResource;
use App\Actions\ToggleActiveAction;
use App\Models\Equipamento;
use App\Models\HistoricoEquipamento;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

final class EquipamentoController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Equipamento::query()->with([
            'tipo.grupo',
            'fornecedor',
            'obra',
            'creator',
            'updater',
            'emprestimoAtivo.renovacoes',
            'manutencaoAtiva',
            'baixa',
        ]);

        match ($request->string('status')->toString()) {
            'em_estoque' => $query->emEstoque(),
            'em_utilizacao' => $query->emUtilizacao(),
            'em_manutencao' => $query->emManutencao(),
            'baixados' => $query->baixados(),
            'perdidos' => $query->perdidos(),
            default => null,
        };

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        } else {
            $query->where('is_active', true);
        }

        if ($request->filled('obra_id')) {
            $query->where('obra_id', $request->integer('obra_id'));
        }

        if ($request->filled('fornecedor_id')) {
            $query->where('fornecedor_id', $request->integer('fornecedor_id'));
        }

        if ($request->filled('tipo_id')) {
            $query->where('tipo_id', $request->integer('tipo_id'));
        }

        if ($request->filled('grupo_id')) {
            $query->whereHas('tipo', fn ($q) => $q->where('grupo_id', $request->integer('grupo_id')));
        }

        if ($request->filled('id')) {
            $query->where('id', $request->integer('id'));
        }

        if ($request->filled('patrimonio')) {
            $patrimonio = $request->string('patrimonio')->toString();
            $query->where('patrimonio', 'like', "%{$patrimonio}%");
        }

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function ($q) use ($search) {
                $q->where('patrimonio', 'like', "%{$search}%")
                    ->orWhereHas('tipo', function ($t) use ($search) {
                        $t->where('nome', 'like', "%{$search}%")
                            ->orWhereHas('grupo', fn ($g) => $g->where('nome', 'like', "%{$search}%"));
                    })
                    ->orWhereHas('fornecedor', fn ($f) => $f->where('nome', 'like', "%{$search}%"))
                    ->orWhereHas('obra', function ($o) use ($search) {
                        $o->where('codigo', 'like', "%{$search}%")
                            ->orWhere('nome', 'like', "%{$search}%");
                    })
                    ->orWhereHas('emprestimoAtivo', function ($e) use ($search) {
                        $e->where('colaborador_nome', 'like', "%{$search}%")
                            ->orWhere('colaborador_matricula', 'like', "%{$search}%")
                            ->orWhere('encarregado_nome', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('parado_dias_min') || $request->filled('parado_dias_max')) {
            $query->comDiasParados(
                $request->filled('parado_dias_min') ? $request->integer('parado_dias_min') : null,
                $request->filled('parado_dias_max') ? $request->integer('parado_dias_max') : null,
            );
        } elseif ($request->filled('parado_dias')) {
            $query->paradoHaMaisDe($request->integer('parado_dias'));
        }

        if ($request->filled('valor_mensal_min')) {
            $query->where('valor_mensal', '>=', $request->input('valor_mensal_min'));
        }

        if ($request->filled('valor_mensal_max')) {
            $query->where('valor_mensal', '<=', $request->input('valor_mensal_max'));
        }

        if ($request->filled('situacao')) {
            $query->comSituacaoEstoque($request->string('situacao')->toString());
        }

        if ($request->boolean('is_critico')) {
            $query->where('is_critico', true);
        } elseif ($request->has('is_critico') && ! $request->boolean('is_critico')) {
            $query->where('is_critico', false);
        }

        if ($request->filled('cadastrado_dias')) {
            $query->where('created_at', '>=', now()->subDays($request->integer('cadastrado_dias')));
        }

        if ($request->filled('created_at_from')) {
            $query->whereDate('created_at', '>=', $request->string('created_at_from')->toString());
        }

        if ($request->filled('created_at_to')) {
            $query->whereDate('created_at', '<=', $request->string('created_at_to')->toString());
        }

        if ($request->filled('updated_at_from')) {
            $query->whereDate('updated_at', '>=', $request->string('updated_at_from')->toString());
        }

        if ($request->filled('updated_at_to')) {
            $query->whereDate('updated_at', '<=', $request->string('updated_at_to')->toString());
        }

        if ($request->filled('created_by')) {
            $createdBy = $request->string('created_by')->toString();
            $query->whereHas(
                'creator',
                fn ($creatorQuery) => $creatorQuery->where('name', 'like', "%{$createdBy}%"),
            );
        }

        if ($request->filled('updated_by')) {
            $updatedBy = $request->string('updated_by')->toString();
            $query->whereHas(
                'updater',
                fn ($updaterQuery) => $updaterQuery->where('name', 'like', "%{$updatedBy}%"),
            );
        }

        if ($request->filled('emprestimo_alerta')) {
            match ($request->string('emprestimo_alerta')->toString()) {
                'vencidos' => $query->whereHas('emprestimoAtivo', fn ($q) => $q->vencidos()),
                'proximos' => $query->whereHas('emprestimoAtivo', fn ($q) => $q->proximosVencimento()),
                'normais' => $query->whereHas('emprestimoAtivo', function ($q) {
                    $q->whereNull('data_devolucao')
                        ->whereRaw('DATE_ADD(data_retirada, INTERVAL prazo_dias DAY) > ?', [
                            now()->addDays(3)->toDateString(),
                        ]);
                }),
                default => null,
            };
        }

        if ($request->filled('manutencao_filtro')) {
            match ($request->string('manutencao_filtro')->toString()) {
                'hoje' => $query->whereHas('manutencaoAtiva', fn ($q) => $q->whereDate('data_entrada', today())),
                'atrasados' => $query->whereHas('manutencaoAtiva', fn ($q) => $q->where(
                    'data_entrada',
                    '<',
                    now()->subDays(7)->toDateString(),
                )),
                'criticos' => $query->where('is_critico', true),
                default => null,
            };
        }

        $equipamentos = $query
            ->applyGridSort(
                $request->filled('sort') ? $request->string('sort')->toString() : null,
                $request->string('direction', 'asc')->toString(),
            )
            ->paginate($request->integer('per_page', 20));

        return EquipamentoResource::collection($equipamentos);
    }

    public function store(StoreEquipamentoRequest $request): EquipamentoResource
    {
        $data = $request->validated();

        if ($request->hasFile('foto')) {
            $data['foto_path'] = $request->file('foto')->store('equipamentos', 'public');
        }
        unset($data['foto']);

        $equipamento = DB::transaction(function () use ($data) {
            $actorId = auth()->id();

            $equipamento = Equipamento::query()->create([
                ...$data,
                'created_by' => $actorId,
                'updated_by' => $actorId,
            ]);

            HistoricoEquipamento::query()->create([
                'equipamento_id' => $equipamento->id,
                'evento' => 'cadastrado',
                'dados' => [
                    'patrimonio' => $equipamento->patrimonio,
                    'fornecedor_id' => $equipamento->fornecedor_id,
                    'obra_id' => $equipamento->obra_id,
                    'data_entrada' => $equipamento->data_entrada->toDateString(),
                ],
                'status_resultante' => 'em_estoque',
                'registrado_por' => auth()->id(),
            ]);

            return $equipamento;
        });

        $equipamento->load(['tipo.grupo', 'fornecedor', 'obra', 'creator', 'updater']);

        return new EquipamentoResource($equipamento);
    }

    public function show(Equipamento $equipamento): EquipamentoResource
    {
        $equipamento->load([
            'tipo.grupo',
            'fornecedor',
            'obra',
            'creator',
            'updater',
            'emprestimoAtivo.renovacoes',
            'manutencaoAtiva',
            'baixa',
        ]);

        return new EquipamentoResource($equipamento);
    }

    public function update(StoreEquipamentoRequest $request, Equipamento $equipamento): EquipamentoResource|JsonResponse
    {
        $data = $request->validated();

        if ($request->hasFile('foto')) {
            if ($equipamento->foto_path && ! str_starts_with($equipamento->foto_path, 'http')) {
                Storage::disk('public')->delete($equipamento->foto_path);
            }
            $data['foto_path'] = $request->file('foto')->store('equipamentos', 'public');
        }
        unset($data['foto']);

        if (isset($data['patrimonio']) && $data['patrimonio'] !== $equipamento->patrimonio) {
            $temRegistros = $equipamento->emprestimos()->exists()
                || $equipamento->manutencoes()->exists();

            if ($temRegistros) {
                return response()->json([
                    'message' => 'Não é possível alterar o patrimônio de um equipamento com histórico de movimentações.',
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }
        }

        $equipamento->update([
            ...$data,
            'updated_by' => auth()->id(),
        ]);

        if ($equipamento->wasChanged()) {
            HistoricoEquipamento::query()->create([
                'equipamento_id' => $equipamento->id,
                'evento' => 'editado',
                'dados' => collect($data)->except(['foto_path'])->all(),
                'status_resultante' => $equipamento->fresh(['emprestimoAtivo', 'manutencaoAtiva', 'baixa'])->status,
                'registrado_por' => auth()->id(),
            ]);
        }

        $equipamento->load([
            'tipo.grupo',
            'fornecedor',
            'obra',
            'creator',
            'updater',
            'emprestimoAtivo.renovacoes',
            'manutencaoAtiva',
            'baixa',
        ]);

        return new EquipamentoResource($equipamento);
    }

    public function toggleActive(ToggleActiveRequest $request, Equipamento $equipamento): EquipamentoResource|JsonResponse
    {
        $equipamento->load(['emprestimoAtivo', 'manutencaoAtiva']);

        if (! $request->boolean('is_active') && $equipamento->emprestimoAtivo) {
            return response()->json([
                'message' => 'Equipamento com empréstimo ativo não pode ser inativado.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if (! $request->boolean('is_active') && $equipamento->manutencaoAtiva) {
            return response()->json([
                'message' => 'Equipamento em manutenção não pode ser inativado.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $equipamento->forceFill(['updated_by' => auth()->id()]);

        $updated = app(ToggleActiveAction::class)->execute(
            $equipamento,
            $request->boolean('is_active'),
        );

        $updated->load([
            'tipo.grupo',
            'fornecedor',
            'obra',
            'creator',
            'updater',
            'emprestimoAtivo.renovacoes',
            'manutencaoAtiva',
            'baixa',
        ]);

        return new EquipamentoResource($updated);
    }

    public function destroy(Equipamento $equipamento): JsonResponse
    {
        $equipamento->load(['emprestimoAtivo', 'manutencaoAtiva']);

        if ($equipamento->emprestimoAtivo) {
            return response()->json([
                'message' => 'Equipamento com empréstimo ativo não pode ser removido.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if ($equipamento->manutencaoAtiva) {
            return response()->json([
                'message' => 'Equipamento em manutenção não pode ser removido.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $equipamento->delete();

        return response()->json([
            'message' => 'Equipamento removido com sucesso.',
        ]);
    }
}
