<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Auth;

use App\Enums\TwoFactorMethod;
use App\Http\Controllers\Controller;
use App\Models\Central\CentralUser;
use App\Models\Tenant;
use App\Models\User;
use App\Services\TwoFactorEmailService;
use App\Services\TwoFactorSyncService;
use App\Support\ApiResponse;
use App\Support\MasksEmail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Validation\ValidationException;
use PragmaRX\Google2FALaravel\Facade as Google2FA;

final class TwoFactorChallengeController extends Controller
{
    /**
     * Validar desafio 2FA após login e retornar token de acesso.
     */
    public function verify(Request $request, TwoFactorSyncService $twoFactorSyncService, TwoFactorEmailService $twoFactorEmailService): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'two_factor_token' => ['required', 'string', 'uuid'],
            'code' => ['required', 'string'],
        ]);

        /** @var array{scope?: string, user_id: int, tenant_id?: string, method?: string}|null $challenge */
        $challenge = $twoFactorEmailService->getChallenge($request->string('two_factor_token')->toString());

        if (! $challenge) {
            throw ValidationException::withMessages([
                'two_factor_token' => ['Token de autenticação expirado ou inválido.'],
            ]);
        }

        $scope = $challenge['scope'] ?? 'tenant';

        if ($scope === 'central') {
            return $this->verifyCentralChallenge(
                $request,
                $challenge,
                $twoFactorSyncService,
                $twoFactorEmailService,
            );
        }

        return $this->verifyTenantChallenge($request, $challenge, $twoFactorEmailService);
    }

    /**
     * Reenviar código por e-mail durante o desafio de login.
     */
    public function resend(Request $request, TwoFactorEmailService $twoFactorEmailService): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'two_factor_token' => ['required', 'string', 'uuid'],
        ]);

        /** @var array{scope?: string, user_id: int, tenant_id?: string, method?: string}|null $challenge */
        $challenge = $twoFactorEmailService->getChallenge($request->string('two_factor_token')->toString());

        if (! $challenge || ($challenge['method'] ?? TwoFactorMethod::Totp->value) !== TwoFactorMethod::Email->value) {
            throw ValidationException::withMessages([
                'two_factor_token' => ['Token de autenticação inválido.'],
            ]);
        }

        $token = $request->string('two_factor_token')->toString();
        $scope = $challenge['scope'] ?? 'tenant';

        if ($scope === 'central') {
            $user = CentralUser::query()->find($challenge['user_id']);

            if (! $user || $user->two_factor_confirmed_at === null) {
                throw ValidationException::withMessages([
                    'two_factor_token' => ['Token de autenticação inválido.'],
                ]);
            }

            $twoFactorEmailService->sendLoginCodeForCentralUser($user, $token);

            return ApiResponse::success(
                ['masked_email' => MasksEmail::mask($user->email)],
                'auth.two_factor.code_resent',
                severity: 'success',
            );
        }

        if (! isset($challenge['tenant_id'])) {
            throw ValidationException::withMessages([
                'two_factor_token' => ['Token de autenticação inválido.'],
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

        if (! $user || $user->two_factor_confirmed_at === null) {
            throw ValidationException::withMessages([
                'two_factor_token' => ['Token de autenticação inválido.'],
            ]);
        }

        $twoFactorEmailService->resendLoginCode($user, $token);

        return ApiResponse::success(
            ['masked_email' => MasksEmail::mask($user->email)],
            'auth.two_factor.code_resent',
            severity: 'success',
        );
    }

    /**
     * @param  array{user_id: int, tenant_id?: string, method?: string}  $challenge
     */
    private function verifyTenantChallenge(Request $request, array $challenge, TwoFactorEmailService $twoFactorEmailService): \Illuminate\Http\JsonResponse
    {
        if (! isset($challenge['tenant_id'])) {
            throw ValidationException::withMessages([
                'two_factor_token' => ['Token de autenticação inválido.'],
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

        if (! $user || $user->two_factor_confirmed_at === null) {
            throw ValidationException::withMessages([
                'two_factor_token' => ['Token de autenticação inválido.'],
            ]);
        }

        $method = TwoFactorMethod::tryFrom($challenge['method'] ?? '')
            ?? $user->two_factor_method
            ?? TwoFactorMethod::Totp;

        $code = $request->string('code')->toString();
        $challengeToken = $request->string('two_factor_token')->toString();

        $verified = $method === TwoFactorMethod::Email
            ? ($twoFactorEmailService->verifyLoginCode($challengeToken, $code) || $this->verifyRecoveryCode($user, $code))
            : ($this->verifyOtp($user->two_factor_secret, $code) || $this->verifyRecoveryCode($user, $code));

        if (! $verified) {
            throw ValidationException::withMessages([
                'code' => ['Código inválido.'],
            ]);
        }

        $twoFactorEmailService->forgetChallenge($challengeToken);

        $accessToken = $user->createToken('api-token')->plainTextToken;
        $request->setUserResolver(fn () => $user);

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'description' => 'Login efetuado com sucesso!',
            'result' => [
                'token' => $accessToken,
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

    /**
     * @param  array{user_id: int, method?: string}  $challenge
     */
    private function verifyCentralChallenge(
        Request $request,
        array $challenge,
        TwoFactorSyncService $twoFactorSyncService,
        TwoFactorEmailService $twoFactorEmailService,
    ): \Illuminate\Http\JsonResponse {
        $user = CentralUser::query()->find($challenge['user_id']);

        if (! $user || $user->two_factor_confirmed_at === null) {
            throw ValidationException::withMessages([
                'two_factor_token' => ['Token de autenticação inválido.'],
            ]);
        }

        $method = TwoFactorMethod::tryFrom($challenge['method'] ?? '')
            ?? $user->two_factor_method
            ?? TwoFactorMethod::Totp;

        $code = $request->string('code')->toString();
        $challengeToken = $request->string('two_factor_token')->toString();

        $verified = $method === TwoFactorMethod::Email
            ? ($twoFactorEmailService->verifyCentralLoginCode($challengeToken, $code) || $this->verifyCentralRecoveryCode($user, $code, $twoFactorSyncService))
            : ($this->verifyOtp($user->two_factor_secret, $code) || $this->verifyCentralRecoveryCode($user, $code, $twoFactorSyncService));

        if (! $verified) {
            throw ValidationException::withMessages([
                'code' => ['Código inválido.'],
            ]);
        }

        $twoFactorEmailService->forgetChallenge($challengeToken);

        $accessToken = $user->createToken('central-api-token')->plainTextToken;

        return ApiResponse::success(
            [
                'token' => $accessToken,
                'scope' => 'central',
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

    private function verifyOtp(?string $encryptedSecret, string $code): bool
    {
        if (! $encryptedSecret) {
            return false;
        }

        $secret = Crypt::decryptString($encryptedSecret);

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

    private function verifyCentralRecoveryCode(
        CentralUser $user,
        string $code,
        TwoFactorSyncService $twoFactorSyncService,
    ): bool {
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

        $encryptedCodes = Crypt::encryptString(json_encode(array_values($codes)));

        $user->update([
            'two_factor_recovery_codes' => $encryptedCodes,
        ]);

        $twoFactorSyncService->syncRecoveryCodesToTenantUsers($user->fresh());

        return true;
    }
}
