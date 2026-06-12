<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Central;

use App\Http\Controllers\Controller;
use App\Models\Central\CentralUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Gestão de super-admins da plataforma (CentralUser.is_super_admin).
 * Rotas: /api/central/v1/admin/central-users — somente super-admin.
 */
final class CentralUserController extends Controller
{
    private function authorizeSuperAdmin(Request $request): void
    {
        abort_unless(
            $request->user() instanceof CentralUser && $request->user()->is_super_admin,
            Response::HTTP_FORBIDDEN
        );
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorizeSuperAdmin($request);

        $users = CentralUser::query()
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'is_super_admin', 'is_active', 'created_at']);

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'result' => ['data' => $users],
        ]);
    }

    public function toggleSuperAdmin(Request $request, CentralUser $centralUser): JsonResponse
    {
        $this->authorizeSuperAdmin($request);

        abort_if(
            $centralUser->id === $request->user()->id,
            Response::HTTP_UNPROCESSABLE_ENTITY,
            'Você não pode alterar seu próprio status de super-admin.'
        );

        $willRevoke = $centralUser->is_super_admin;

        if ($willRevoke) {
            $remaining = CentralUser::query()
                ->where('is_super_admin', true)
                ->where('id', '!=', $centralUser->id)
                ->count();

            abort_if(
                $remaining === 0,
                Response::HTTP_UNPROCESSABLE_ENTITY,
                'Não é possível remover o último super-admin da plataforma.'
            );
        }

        $centralUser->update(['is_super_admin' => ! $centralUser->is_super_admin]);

        return response()->json([
            'status' => 1,
            'message' => 'MSG000425',
            'result' => [
                'id' => $centralUser->id,
                'is_super_admin' => $centralUser->is_super_admin,
            ],
        ]);
    }
}
