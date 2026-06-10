<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Central;

use App\Models\Central\CentralUser;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpFoundation\Response;

final class CentralAuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = CentralUser::where('email', $validated['email'])
            ->where('is_active', true)
            ->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'status'  => 0,
                'message' => 'Credenciais inválidas.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        if (! $user->is_super_admin) {
            return response()->json([
                'status'  => 0,
                'message' => 'Acesso não autorizado.',
            ], Response::HTTP_FORBIDDEN);
        }

        $token = $user->createToken('central-api-token')->plainTextToken;

        return response()->json([
            'status'  => 1,
            'message' => 'MSG000067',
            'result'  => [
                'token' => $token,
                'user'  => [
                    'id'             => $user->id,
                    'name'           => $user->name,
                    'email'          => $user->email,
                    'is_super_admin' => $user->is_super_admin,
                ],
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'status'  => 1,
            'message' => 'MSG000067',
            'result'  => [
                'id'             => $user->id,
                'name'           => $user->name,
                'email'          => $user->email,
                'is_super_admin' => $user->is_super_admin,
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'status'  => 1,
            'message' => 'MSG000067',
            'result'  => null,
        ]);
    }
}
