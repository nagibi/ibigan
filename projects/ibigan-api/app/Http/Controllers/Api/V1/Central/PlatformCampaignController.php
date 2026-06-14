<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Central;

use App\Http\Controllers\Controller;
use App\Http\Requests\Central\StorePlatformCampaignRequest;
use App\Models\Central\CentralUser;
use App\Services\PlatformCampaignDispatchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class PlatformCampaignController extends Controller
{
    public function __construct(
        private readonly PlatformCampaignDispatchService $platformCampaignDispatchService,
    ) {}

    public function store(StorePlatformCampaignRequest $request): JsonResponse
    {
        $this->authorizeSuperAdmin($request);

        $validated = $request->validated();
        $tenantIds = $validated['tenant_ids'];
        unset($validated['tenant_ids']);

        $result = $this->platformCampaignDispatchService->dispatch($tenantIds, $validated);

        return response()->json([
            'status' => 1,
            'message' => 'MSG000424',
            'description' => 'Campanhas enfileiradas nas empresas selecionadas.',
            'result' => $result,
        ], Response::HTTP_CREATED);
    }

    private function authorizeSuperAdmin(Request $request): void
    {
        abort_unless(
            $request->user() instanceof CentralUser && $request->user()->is_super_admin,
            Response::HTTP_FORBIDDEN,
        );
    }
}
