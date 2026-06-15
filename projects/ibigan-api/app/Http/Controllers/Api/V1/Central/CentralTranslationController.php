<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Central;

use App\Http\Controllers\Controller;
use App\Http\Requests\Translation\StoreTranslationRequest;
use App\Http\Requests\Translation\UpdateTranslationRequest;
use App\Models\Central\CentralUser;
use App\Models\Central\PlatformTranslation;
use App\Models\Tenant;
use App\Services\PlatformTranslationService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class CentralTranslationController extends Controller
{
    public function __construct(
        private readonly PlatformTranslationService $platformTranslationService,
    ) {}

    public function index(Request $request, Tenant $tenant): JsonResponse
    {
        $this->authorizeSuperAdmin($request);

        $items = $this->platformTranslationService->listManaged($request, $tenant->id);

        return ApiResponse::success($items);
    }

    public function store(StoreTranslationRequest $request, Tenant $tenant): JsonResponse
    {
        $this->authorizeSuperAdmin($request);

        $translation = $this->platformTranslationService->store(
            $tenant->id,
            $request->validated(),
        );

        return ApiResponse::success(
            $translation,
            'translation.created_successfully',
            severity: 'success',
            httpStatus: Response::HTTP_CREATED,
        );
    }

    public function update(
        UpdateTranslationRequest $request,
        Tenant $tenant,
        int $platformTranslation,
    ): JsonResponse {
        $this->authorizeSuperAdmin($request);

        $translation = PlatformTranslation::query()
            ->forTenant($tenant->id)
            ->findOrFail($platformTranslation);

        $updated = $this->platformTranslationService->update($translation, $request->validated());

        return ApiResponse::success(
            $updated,
            'translation.updated_successfully',
            severity: 'success',
        );
    }

    private function authorizeSuperAdmin(Request $request): void
    {
        /** @var CentralUser|null $user */
        $user = $request->user('central');

        abort_unless($user?->is_super_admin, Response::HTTP_FORBIDDEN);
    }
}
