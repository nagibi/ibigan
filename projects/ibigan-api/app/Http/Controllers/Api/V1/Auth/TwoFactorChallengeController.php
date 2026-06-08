<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Validation\ValidationException;
use PragmaRX\Google2FALaravel\Facade as Google2FA;

final class TwoFactorChallengeController extends Controller
{
    /**
     * Validar desafio 2FA após login e retornar token de acesso.
     *
     * Aceita código OTP ou recovery code. Rota pública.
     */
    public function verify(Request $request): JsonResponse
    {
        $request->validate([
            'two_factor_token' => ['required', 'string', 'uuid'],
            'code' => ['required', 'string'],
        ]);

        /** @var array{user_id: int, tenant_id: string}|null $challenge */
        $challenge = Cache::get('two_factor:'.$request->string('two_factor_token'));

        if (! $challenge) {
            throw ValidationException::withMessages([
                'two_factor_token' => ['Token de autenticação expirado ou inválido.'],
            ]);
        }

        $tenant = Tenant::find($challenge['tenant_id']);

        if (! $tenant) {
            throw ValidationException::withMessages([
                'two_factor_token' => ['Organização não encontrada.'],
            ]);
        }

        tenancy()->initialize($tenant);

        $user = User::query()->find($challenge['user_id']);

        if (! $user || $user->two_factor_confirmed_at === null || ! $user->two_factor_secret) {
            throw ValidationException::withMessages([
                'two_factor_token' => ['Token de autenticação inválido.'],
            ]);
        }

        $code = $request->string('code')->toString();
        $verified = $this->verifyOtp($user, $code) || $this->verifyRecoveryCode($user, $code);

        if (! $verified) {
            throw ValidationException::withMessages([
                'code' => ['Código inválido.'],
            ]);
        }

        Cache::forget('two_factor:'.$request->string('two_factor_token'));

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'description' => 'Login efetuado com sucesso!',
            'result' => [
                'token' => $token,
                'tenant_id' => $tenant->id,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'roles' => $user->getRoleNames(),
                    'permissions' => $user->getAllPermissions()->pluck('name'),
                ],
            ],
        ]);
    }

    private function verifyOtp(User $user, string $code): bool
    {
        $secret = Crypt::decryptString($user->two_factor_secret);

        return Google2FA::verifyKey($secret, $code);
    }

    private function verifyRecoveryCode(User $user, string $code): bool
    {
        if (! $user->two_factor_recovery_codes) {
            return false;
        }

        /** @var array<int, string> $codes */
        $codes = json_decode(Crypt::decryptString($user->two_factor_recovery_codes), true);
        $index = array_search($code, $codes, true);

        if ($index === false) {
            return false;
        }

        unset($codes[$index]);

        $user->update([
            'two_factor_recovery_codes' => Crypt::encryptString(json_encode(array_values($codes))),
        ]);

        return true;
    }
}
