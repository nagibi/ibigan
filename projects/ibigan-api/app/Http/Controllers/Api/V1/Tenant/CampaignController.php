<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Data\CampaignData;
use App\Data\CampaignDeliveryData;
use App\Enums\CampaignStatus;
use App\Http\Controllers\Concerns\TogglesModelActive;
use App\Http\Controllers\Controller;
use App\Http\Requests\ToggleActiveRequest;
use App\Http\Requests\Campaign\StoreCampaignRequest;
use App\Http\Requests\Campaign\UpdateCampaignRequest;
use App\Models\Campaign;
use App\Services\CampaignService;
use Illuminate\Database\Eloquent\Model;
use App\Support\GridFilter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class CampaignController extends Controller
{
    use TogglesModelActive;

    public function __construct(
        private readonly CampaignService $campaignService,
    ) {}

    /**
     * Listar campanhas paginadas.
     *
     * Requer permissão `campanha-visualizar`.
     */
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('campanha-visualizar'), Response::HTTP_FORBIDDEN);

        $campaigns = Campaign::query()
            ->when(
                $request->filled('status'),
                fn ($q) => GridFilter::applyWhereInFromCsv($q, 'status', $request->string('status')->toString()),
            )
            ->when(
                $request->filled('type'),
                fn ($q) => GridFilter::applyWhereInFromCsv($q, 'type', $request->string('type')->toString()),
            )
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'result' => [
                'data' => CampaignData::collect($campaigns->items()),
                'meta' => [
                    'current_page' => $campaigns->currentPage(),
                    'last_page' => $campaigns->lastPage(),
                    'per_page' => $campaigns->perPage(),
                    'total' => $campaigns->total(),
                ],
            ],
        ]);
    }

    /**
     * Retornar detalhes de uma campanha.
     */
    public function show(Request $request, Campaign $campaign): JsonResponse
    {
        abort_unless($request->user()->can('campanha-visualizar'), Response::HTTP_FORBIDDEN);

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'result' => CampaignData::fromModel($campaign),
        ]);
    }

    /**
     * Criar campanha e destinatários.
     *
     * Dispara envio imediato se não houver `scheduled_at`.
     */
    public function store(StoreCampaignRequest $request): JsonResponse
    {
        abort_unless($request->user()->can('campanha-gerenciar'), Response::HTTP_FORBIDDEN);

        $scheduledAt = $request->validated('scheduled_at');

        $campaign = Campaign::query()->create([
            'name' => $request->validated('name'),
            'description' => $request->validated('description'),
            'template_id' => $request->validated('template_id'),
            'subject' => $request->validated('subject'),
            'body' => $request->validated('body'),
            'merge_data' => $request->validated('merge_data'),
            'channels' => $request->validated('channels'),
            'status' => $scheduledAt ? CampaignStatus::Scheduled : CampaignStatus::Draft,
            'scheduled_at' => $scheduledAt,
            'created_by' => $request->user()->id,
        ]);

        foreach ($request->validated('recipients') as $recipient) {
            $campaign->recipients()->create([
                'type' => $recipient['type'],
                'value' => $recipient['value'] ?? null,
            ]);
        }

        if (! $scheduledAt) {
            $this->campaignService->dispatch($campaign);
        }

        return response()->json([
            'status' => 1,
            'message' => 'MSG000424',
            'result' => CampaignData::fromModel($campaign->fresh()),
        ], Response::HTTP_CREATED);
    }

    /**
     * Atualizar campanha em rascunho.
     */
    public function update(UpdateCampaignRequest $request, Campaign $campaign): JsonResponse
    {
        abort_unless($request->user()->can('campanha-gerenciar'), Response::HTTP_FORBIDDEN);
        abort_unless($campaign->status === CampaignStatus::Draft, Response::HTTP_UNPROCESSABLE_ENTITY);

        $scheduledAt = $request->validated('scheduled_at');

        $campaign->update([
            'name' => $request->validated('name'),
            'description' => $request->validated('description'),
            'template_id' => $request->validated('template_id'),
            'subject' => $request->validated('subject'),
            'body' => $request->validated('body'),
            'merge_data' => $request->validated('merge_data'),
            'channels' => $request->validated('channels'),
            'scheduled_at' => $scheduledAt,
            'status' => $scheduledAt ? CampaignStatus::Scheduled : CampaignStatus::Draft,
        ]);

        $campaign->recipients()->delete();

        foreach ($request->validated('recipients') as $recipient) {
            $campaign->recipients()->create([
                'type' => $recipient['type'],
                'value' => $recipient['value'] ?? null,
            ]);
        }

        return response()->json([
            'status' => 1,
            'message' => 'MSG000425',
            'result' => CampaignData::fromModel($campaign->fresh()),
        ]);
    }

    /**
     * Ativar ou inativar campanha.
     *
     * Requer permissão `campanha-gerenciar`.
     */
    public function toggleActive(ToggleActiveRequest $request, Campaign $campaign): JsonResponse
    {
        return $this->performToggleActive($request, $campaign);
    }

    protected function toggleActivePermission(): string
    {
        return 'campanha-gerenciar';
    }

    protected function formatToggleActiveResult(Model $model): CampaignData
    {
        /** @var Campaign $model */
        return CampaignData::fromModel($model);
    }

    /**
     * Remover campanha (soft delete).
     *
     * Apenas campanhas em rascunho ou canceladas.
     */
    public function destroy(Request $request, Campaign $campaign): JsonResponse
    {
        abort_unless($request->user()->can('campanha-gerenciar'), Response::HTTP_FORBIDDEN);
        abort_unless(
            in_array($campaign->status, [CampaignStatus::Draft, CampaignStatus::Cancelled], true),
            Response::HTTP_UNPROCESSABLE_ENTITY,
        );

        $campaign->delete();

        return response()->json([
            'status' => 1,
            'message' => 'MSG000426',
            'result' => null,
        ]);
    }

    /**
     * Cancelar campanha agendada ou em envio.
     */
    public function cancel(Request $request, Campaign $campaign): JsonResponse
    {
        abort_unless($request->user()->can('campanha-gerenciar'), Response::HTTP_FORBIDDEN);
        abort_unless(
            in_array($campaign->status, [CampaignStatus::Draft, CampaignStatus::Scheduled, CampaignStatus::Sending], true),
            Response::HTTP_UNPROCESSABLE_ENTITY,
        );

        $campaign->update(['status' => CampaignStatus::Cancelled]);

        return response()->json([
            'status' => 1,
            'message' => 'MSG000425',
            'result' => CampaignData::fromModel($campaign->fresh()),
        ]);
    }

    /**
     * Listar entregas de uma campanha.
     */
    public function deliveries(Request $request, Campaign $campaign): JsonResponse
    {
        abort_unless($request->user()->can('campanha-visualizar'), Response::HTTP_FORBIDDEN);

        $deliveries = $campaign->deliveries()
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('channel'), fn ($q) => $q->where('channel', $request->string('channel')))
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'result' => [
                'data' => CampaignDeliveryData::collect($deliveries->items()),
                'meta' => [
                    'current_page' => $deliveries->currentPage(),
                    'last_page' => $deliveries->lastPage(),
                    'per_page' => $deliveries->perPage(),
                    'total' => $deliveries->total(),
                ],
            ],
        ]);
    }
}
