<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Central;

use App\Data\CentralUserData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Central\UpdateCentralUserRequest;
use App\Http\Requests\ToggleActiveRequest;
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

    public function show(Request $request, CentralUser $centralUser): JsonResponse
    {
        $this->authorizeSuperAdmin($request);

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'result' => CentralUserData::fromModel($centralUser),
        ]);
    }

    public function update(UpdateCentralUserRequest $request, CentralUser $centralUser): JsonResponse
    {
        $this->authorizeSuperAdmin($request);

        /** @var CentralUser $actor */
        $actor = $request->user();
        $validated = $request->validated();

        if (! $validated['is_active']) {
            $this->ensureCanDeactivate($actor, $centralUser);
        }

        $payload = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'is_active' => $validated['is_active'],
        ];

        if (! empty($validated['password'])) {
            $payload['password'] = $validated['password'];
        }

        $shouldRevokeTokens = ! $validated['is_active'] || ! empty($validated['password']);

        $centralUser->update($payload);

        if ($shouldRevokeTokens) {
            $centralUser->tokens()->delete();
        }

        return response()->json([
            'status' => 1,
            'message' => 'MSG000425',
            'result' => CentralUserData::fromModel($centralUser->fresh()),
        ]);
    }

    public function toggleActive(ToggleActiveRequest $request, CentralUser $centralUser): JsonResponse
    {
        $this->authorizeSuperAdmin($request);

        /** @var CentralUser $actor */
        $actor = $request->user();
        $isActive = $request->boolean('is_active');

        if (! $isActive) {
            $this->ensureCanDeactivate($actor, $centralUser);
        }

        $centralUser->update(['is_active' => $isActive]);

        if (! $isActive) {
            $centralUser->tokens()->delete();
        }

        return response()->json([
            'status' => 1,
            'message' => 'MSG000425',
            'result' => CentralUserData::fromModel($centralUser->fresh()),
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

    private function ensureCanDeactivate(CentralUser $actor, CentralUser $target): void
    {
        abort_if(
            $target->id === $actor->id,
            Response::HTTP_UNPROCESSABLE_ENTITY,
            'Você não pode desativar seu próprio usuário.'
        );

        if (! $target->is_super_admin) {
            return;
        }

        $remainingActiveSuperAdmins = CentralUser::query()
            ->where('is_super_admin', true)
            ->where('is_active', true)
            ->where('id', '!=', $target->id)
            ->count();

        abort_if(
            $remainingActiveSuperAdmins === 0,
            Response::HTTP_UNPROCESSABLE_ENTITY,
            'Não é possível desativar o último super-admin ativo da plataforma.'
        );
    }
}
