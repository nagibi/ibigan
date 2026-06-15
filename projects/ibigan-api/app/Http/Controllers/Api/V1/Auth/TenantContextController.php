<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Services\TenantContextResolver;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class TenantContextController extends Controller
{
    public function __construct(
        private readonly TenantContextResolver $tenantContextResolver,
    ) {}

  /**
     * Resolve o tenant a partir do domínio, subdomínio de dev ou query ?tenant=slug.
     */
    public function show(Request $request): JsonResponse
    {
        $host = $this->tenantContextResolver->normalizeHost($request);
        $isCentralHost = $this->tenantContextResolver->isCentralHost($host);
        ['tenant' => $tenant, 'source' => $source] = $this->tenantContextResolver->resolveWithSource($request);

        if ($tenant === null) {
            return ApiResponse::success([
                'resolved' => false,
                'is_central_host' => $isCentralHost,
                'host' => $host,
                'source' => null,
                'tenant' => null,
            ]);
        }

        if (! $tenant->is_active) {
            return ApiResponse::error(
                'auth.login.tenant_inactive',
                httpStatus: Response::HTTP_UNPROCESSABLE_ENTITY,
            );
        }

        return ApiResponse::success([
            'resolved' => true,
            'is_central_host' => $isCentralHost,
            'host' => $host,
            'source' => $source,
            'tenant' => $this->tenantPayload($tenant),
        ]);
    }

  /**
     * @return array{id: string, slug: string, name: string|null, locale: string|null}
     */
    private function tenantPayload(Tenant $tenant): array
    {
        return [
            'id' => (string) $tenant->id,
            'slug' => (string) $tenant->slug,
            'name' => $tenant->name,
            'locale' => $tenant->locale ?? null,
        ];
    }
}
