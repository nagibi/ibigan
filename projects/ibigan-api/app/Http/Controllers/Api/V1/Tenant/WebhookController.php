<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Actions\ToggleActiveAction;
use App\Data\WebhookData;
use App\Http\Requests\ToggleActiveRequest;
use App\Data\WebhookDeliveryData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Webhook\StoreWebhookRequest;
use App\Http\Requests\Webhook\UpdateWebhookRequest;
use App\Models\Webhook;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class WebhookController extends Controller
{
    /**
     * Listar webhooks configurados.
     *
     * Requer permissão `webhook-visualizar`.
     */
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('webhook-visualizar'), Response::HTTP_FORBIDDEN);

        $webhooks = Webhook::query()
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'result' => [
                'data' => WebhookData::collect($webhooks->items()),
                'meta' => [
                    'current_page' => $webhooks->currentPage(),
                    'last_page' => $webhooks->lastPage(),
                    'per_page' => $webhooks->perPage(),
                    'total' => $webhooks->total(),
                ],
            ],
        ]);
    }

    /**
     * Retornar um webhook específico.
     */
    public function show(Request $request, Webhook $webhook): JsonResponse
    {
        abort_unless($request->user()->can('webhook-visualizar'), Response::HTTP_FORBIDDEN);

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'result' => WebhookData::fromModel($webhook),
        ]);
    }

    /**
     * Criar webhook para receber eventos HTTP.
     */
    public function store(StoreWebhookRequest $request): JsonResponse
    {
        abort_unless($request->user()->can('webhook-gerenciar'), Response::HTTP_FORBIDDEN);

        $webhook = Webhook::query()->create($request->validated());

        return response()->json([
            'status' => 1,
            'message' => 'MSG000424',
            'result' => WebhookData::fromModel($webhook),
        ], Response::HTTP_CREATED);
    }

    /**
     * Atualizar webhook existente.
     */
    public function update(UpdateWebhookRequest $request, Webhook $webhook): JsonResponse
    {
        abort_unless($request->user()->can('webhook-gerenciar'), Response::HTTP_FORBIDDEN);

        $webhook->update($request->validated());

        return response()->json([
            'status' => 1,
            'message' => 'MSG000425',
            'result' => WebhookData::fromModel($webhook->fresh()),
        ]);
    }

    /**
     * Ativar ou inativar webhook.
     *
     * Requer permissão `webhook-gerenciar`.
     */
    public function toggleActive(ToggleActiveRequest $request, Webhook $webhook): JsonResponse
    {
        abort_unless($request->user()->can('webhook-gerenciar'), Response::HTTP_FORBIDDEN);

        $updated = app(ToggleActiveAction::class)->execute(
            $webhook,
            $request->boolean('is_active'),
        );

        return response()->json([
            'status' => 1,
            'message' => 'MSG000425',
            'result' => WebhookData::fromModel($updated),
        ]);
    }

    /**
     * Remover webhook.
     */
    public function destroy(Request $request, Webhook $webhook): JsonResponse
    {
        abort_unless($request->user()->can('webhook-gerenciar'), Response::HTTP_FORBIDDEN);

        $webhook->delete();

        return response()->json([
            'status' => 1,
            'message' => 'MSG000426',
            'result' => null,
        ]);
    }

    /**
     * Listar histórico de entregas de um webhook.
     */
    public function deliveries(Request $request, Webhook $webhook): JsonResponse
    {
        abort_unless($request->user()->can('webhook-visualizar'), Response::HTTP_FORBIDDEN);

        $deliveries = $webhook->deliveries()
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'result' => [
                'data' => WebhookDeliveryData::collect($deliveries->items()),
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
