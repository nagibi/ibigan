<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Central;

use App\Http\Controllers\Controller;
use App\Enums\TwoFactorMethod;
use App\Models\Central\CentralUser;
use App\Services\TwoFactorEmailService;
use App\Support\ApiResponse;
use App\Support\MasksEmail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

final class CentralAuthController extends Controller
{
    public function login(Request $request, TwoFactorEmailService $twoFactorEmailService): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = CentralUser::where('email', $validated['email'])
            ->where('is_active', true)
            ->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return ApiResponse::error(
                'auth.login.invalid_credentials',
                httpStatus: Response::HTTP_UNAUTHORIZED,
            );
        }

        if (! $user->is_super_admin) {
            return ApiResponse::error(
                'auth.login.unauthorized',
                httpStatus: Response::HTTP_FORBIDDEN,
            );
        }

        if ($user->two_factor_confirmed_at !== null) {
            $twoFactorToken = Str::uuid()->toString();
            $method = $user->two_factor_method ?? TwoFactorMethod::Totp;

            $twoFactorEmailService->storeChallenge($twoFactorToken, [
                'scope' => 'central',
                'user_id' => $user->id,
                'method' => $method->value,
            ]);

            if ($method === TwoFactorMethod::Email) {
                $twoFactorEmailService->sendLoginCodeForCentralUser($user, $twoFactorToken);
            }

            return ApiResponse::success(
                [
                    'requires_2fa' => true,
                    'two_factor_token' => $twoFactorToken,
                    'two_factor_method' => $method->value,
                    'masked_email' => MasksEmail::mask($user->email),
                ],
                'auth.login.two_factor_required',
                severity: 'info',
            );
        }

        $token = $user->createToken('central-api-token')->plainTextToken;

        return ApiResponse::success(
            [
                'token' => $token,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'is_super_admin' => $user->is_super_admin,
                ],
            ],
            'auth.login.success',
            severity: 'success',
        );
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return ApiResponse::success([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'is_super_admin' => $user->is_super_admin,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return ApiResponse::success(null, 'auth.logout.success', severity: 'success');
    }
}
