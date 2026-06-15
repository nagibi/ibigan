<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Services\PlatformTranslationService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response;

final class TranslationController extends Controller
{
    public function __construct(
        private readonly PlatformTranslationService $platformTranslationService,
    ) {}

    /**
     * Sobrescritas da empresa (gerenciadas no painel central).
     */
    public function index(Request $request): JsonResponse
    {
        $tenantId = $request->header('X-Tenant-ID');

        if (! is_string($tenantId) || $tenantId === '' || Tenant::query()->whereKey($tenantId)->doesntExist()) {
            return ApiResponse::error(
                'auth.login.tenant_not_found',
                httpStatus: Response::HTTP_UNPROCESSABLE_ENTITY,
            );
        }

        $validated = $request->validate([
            'locale' => ['sometimes', 'string', Rule::in(['pt', 'en'])],
        ]);

        $locale = $validated['locale'] ?? 'pt';

        $overrides = $this->platformTranslationService->overridesForTenant($tenantId, $locale);

        return ApiResponse::success([
            'locale' => $locale,
            'overrides' => $overrides === [] ? (object) [] : $overrides,
        ]);
    }
}
