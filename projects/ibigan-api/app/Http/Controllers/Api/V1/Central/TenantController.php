<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Central;

use App\Data\TenantData;
use App\Http\Controllers\Controller;
use App\Models\Central\TenantUser;
use App\Models\Tenant;
use App\Models\User;
use App\Repositories\Contracts\CentralUserRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class TenantController extends Controller
{
    public function __construct(
        private readonly CentralUserRepositoryInterface $centralUserRepository,
    ) {}

    /**
     * Listar tenants disponíveis para o usuário autenticado.
     *
     * Rota central — não requer header `X-Tenant-ID`.
     */
    public function index(Request $request): JsonResponse
    {
        $tenantUsers = $this->centralUserRepository->tenantsForUser($request->user()->id);

        $tenants = $tenantUsers
            ->map(fn (TenantUser $tenantUser): TenantData => TenantData::fromModel(
                $tenantUser->tenant,
                $tenantUser->is_default,
            ))
            ->values();

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'result' => $tenants,
        ]);
    }

    /**
     * Trocar de tenant e obter novo token de acesso.
     *
     * Rota central — valida vínculo do usuário com o tenant informado.
     */
    public function switch(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tenant_id' => ['required', 'string', 'exists:tenants,id'],
        ]);

        $tenantUser = TenantUser::query()
            ->where('user_id', $request->user()->id)
            ->where('tenant_id', $validated['tenant_id'])
            ->first();

        if (! $tenantUser) {
            abort(Response::HTTP_FORBIDDEN, 'Você não tem acesso a esta organização.');
        }

        $tenant = Tenant::findOrFail($validated['tenant_id']);

        tenancy()->initialize($tenant);

        $user = User::findOrFail($tenantUser->user_id);

        $token = $user->createToken('api-token', ['tenant:'.$tenant->id])->plainTextToken;

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'description' => 'Organização alterada com sucesso!',
            'result' => [
                'token' => $token,
                'tenant_id' => $tenant->id,
            ],
        ]);
    }
}
