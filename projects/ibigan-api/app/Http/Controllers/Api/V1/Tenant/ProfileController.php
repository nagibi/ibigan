<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Data\UserData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Profile\UpdatePasswordRequest;
use App\Http\Requests\Profile\UpdateProfileRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

final class ProfileController extends Controller
{
    /**
     * Retornar perfil do usuário autenticado.
     */
    public function show(Request $request): JsonResponse
    {
        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'result' => UserData::fromModel($request->user()->load('roles')),
        ]);
    }

    /**
     * Atualizar dados do perfil.
     */
    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->update($request->validated());

        return response()->json([
            'status' => 1,
            'message' => 'MSG000425',
            'result' => UserData::fromModel($user->fresh()->load('roles')),
        ]);
    }

    /**
     * Atualizar senha do perfil.
     *
     * Invalida tokens de acesso anteriores, exceto o atual.
     */
    public function updatePassword(UpdatePasswordRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->update([
            'password' => Hash::make($request->validated('password')),
        ]);

        $user->tokens()->where('id', '!=', $user->currentAccessToken()->id)->delete();

        return response()->json([
            'status' => 1,
            'message' => 'MSG000425',
            'result' => null,
        ]);
    }

    /**
     * Fazer upload do avatar do perfil.
     */
    public function uploadAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => ['required', 'image', 'max:2048'],
        ]);

        $user = $request->user();
        $user->addMediaFromRequest('avatar')
            ->toMediaCollection('avatar');

        return response()->json([
            'status' => 1,
            'message' => 'MSG000425',
            'result' => UserData::fromModel($user->fresh()->load('roles')),
        ]);
    }

    /**
     * Remover avatar do perfil.
     */
    public function deleteAvatar(Request $request): JsonResponse
    {
        $request->user()->clearMediaCollection('avatar');

        return response()->json([
            'status' => 1,
            'message' => 'MSG000426',
            'result' => null,
        ]);
    }
}
