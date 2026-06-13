<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\Tenant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class InitializeTenancyByRouteParameter
{
    public function handle(Request $request, Closure $next): Response
    {
        $tenantId = $request->route('tenant');

        if (is_string($tenantId) && $tenantId !== '' && ! tenancy()->initialized) {
            $tenant = Tenant::find($tenantId);

            if ($tenant) {
                tenancy()->initialize($tenant);
            }
        }

        return $next($request);
    }
}
