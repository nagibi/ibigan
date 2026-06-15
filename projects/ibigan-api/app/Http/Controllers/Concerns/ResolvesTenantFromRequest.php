<?php

declare(strict_types=1);

namespace App\Http\Controllers\Concerns;

use App\Services\TenantContextResolver;
use Illuminate\Http\Request;

trait ResolvesTenantFromRequest
{
    protected function mergeResolvedTenantId(Request $request): void
    {
        if ($request->filled('tenant_id')) {
            return;
        }

        $tenantId = app(TenantContextResolver::class)->resolveTenantId($request);

        if ($tenantId !== null) {
            $request->merge(['tenant_id' => $tenantId]);
        }
    }
}
