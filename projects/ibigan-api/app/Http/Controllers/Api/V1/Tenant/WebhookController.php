<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Data\WebhookData;
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
    public function index(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

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

    public function show(Request $request, Webhook $webhook): JsonResponse
    {
        $this->ensureAdmin($request);

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'result' => WebhookData::fromModel($webhook),
        ]);
    }

    public function store(StoreWebhookRequest $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $webhook = Webhook::query()->create($request->validated());

        return response()->json([
            'status' => 1,
            'message' => 'MSG000424',
            'result' => WebhookData::fromModel($webhook),
        ], Response::HTTP_CREATED);
    }

    public function update(UpdateWebhookRequest $request, Webhook $webhook): JsonResponse
    {
        $this->ensureAdmin($request);

        $webhook->update($request->validated());

        return response()->json([
            'status' => 1,
            'message' => 'MSG000425',
            'result' => WebhookData::fromModel($webhook->fresh()),
        ]);
    }

    public function destroy(Request $request, Webhook $webhook): JsonResponse
    {
        $this->ensureAdmin($request);

        $webhook->delete();

        return response()->json([
            'status' => 1,
            'message' => 'MSG000426',
            'result' => null,
        ]);
    }

    public function deliveries(Request $request, Webhook $webhook): JsonResponse
    {
        $this->ensureAdmin($request);

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

    private function ensureAdmin(Request $request): void
    {
        abort_unless(
            $request->user()->hasAnyRole(['admin', 'super-admin']),
            Response::HTTP_FORBIDDEN
        );
    }
}
