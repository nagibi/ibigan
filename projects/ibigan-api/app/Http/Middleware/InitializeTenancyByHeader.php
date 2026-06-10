<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\Tenant;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class InitializeTenancyByHeader
{
    public function handle(Request $request, Closure $next): Response
    {
        $tenantId = $request->header('X-Tenant-ID');

        // Para rotas centrais — tentar extrair tenant do token
        if (! $tenantId && str_contains($request->path(), 'central/v1')) {
            $tenantId = $this->extractTenantFromToken($request);
        }

        if ($tenantId) {
            $tenant = Tenant::find($tenantId);
            if ($tenant) {
                tenancy()->initialize($tenant);
            }
        }

        return $next($request);
    }

    private function extractTenantFromToken(Request $request): ?string
    {
        $token = $request->bearerToken();
        if (! $token) {
            return null;
        }

        $id = explode('|', $token, 2)[0] ?? null;
        if (! $id) {
            return null;
        }

        // Buscar tenant_id via tenant_users pelo token_id
        $record = DB::connection('central')
            ->table('personal_access_tokens')
            ->where('id', $id)
            ->first();

        if (! $record) {
            return null;
        }

        $tenantUser = DB::connection('central')
            ->table('tenant_users')
            ->where('user_id', $record->tokenable_id)
            ->first();

        return $tenantUser?->tenant_id;
    }
}
