<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Central;

use App\Enums\TwoFactorMethod;
use App\Http\Controllers\Controller;
use App\Models\Central\CentralUser;
use App\Services\TwoFactorEmailService;
use App\Services\TwoFactorSyncService;
use App\Services\UserPasswordVerificationService;
use App\Support\MasksEmail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use PragmaRX\Google2FALaravel\Facade as Google2FA;

final class CentralTwoFactorController extends Controller
{
    public function status(Request $request): JsonResponse
    {
        /** @var CentralUser $user */
        $user = $request->user();
        $enabled = $user->two_factor_confirmed_at !== null;

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'result' => [
                'enabled' => $enabled,
                'method' => $enabled ? ($user->two_factor_method?->value ?? TwoFactorMethod::Totp->value) : null,
                'masked_email' => MasksEmail::mask($user->email),
                'recovery_codes' => $enabled ? $this->decryptRecoveryCodes($user) : [],
            ],
        ]);
    }

    public function enable(Request $request, TwoFactorEmailService $twoFactorEmailService): JsonResponse
    {
        $validated = $request->validate([
            'method' => ['sometimes', 'string', Rule::enum(TwoFactorMethod::class)],
        ]);

        $method = TwoFactorMethod::from($validated['method'] ?? TwoFactorMethod::Totp->value);

        /** @var CentralUser $user */
        $user = $request->user();

        if ($user->two_factor_confirmed_at !== null) {
            throw ValidationException::withMessages([
                'two_factor' => ['A autenticação em duas etapas já está ativa.'],
            ]);
        }

        $recoveryCodes = $this->generateRecoveryCodes();

        if ($method === TwoFactorMethod::Email) {
            $user->update([
                'two_factor_method' => TwoFactorMethod::Email,
                'two_factor_secret' => null,
                'two_factor_recovery_codes' => Crypt::encryptString(json_encode($recoveryCodes)),
                'two_factor_confirmed_at' => null,
            ]);

            $twoFactorEmailService->sendSetupCodeForCentralUser($user);

            return response()->json([
                'status' => 1,
                'message' => 'MSG000067',
                'result' => [
                    'method' => TwoFactorMethod::Email->value,
                    'masked_email' => MasksEmail::mask($user->email),
                    'recovery_codes' => $recoveryCodes,
                ],
            ]);
        }

        $secret = Google2FA::generateSecretKey();

        $user->update([
            'two_factor_method' => TwoFactorMethod::Totp,
            'two_factor_secret' => Crypt::encryptString($secret),
            'two_factor_recovery_codes' => Crypt::encryptString(json_encode($recoveryCodes)),
            'two_factor_confirmed_at' => null,
        ]);

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'result' => [
                'method' => TwoFactorMethod::Totp->value,
                'secret' => $secret,
                'qr_code_url' => Google2FA::getQRCodeUrl(config('app.name'), $user->email, $secret),
                'recovery_codes' => $recoveryCodes,
            ],
        ]);
    }

    public function confirm(
        Request $request,
        TwoFactorSyncService $twoFactorSyncService,
        TwoFactorEmailService $twoFactorEmailService,
    ): JsonResponse {
        $request->validate([
            'code' => ['required', 'string'],
        ]);

        /** @var CentralUser $user */
        $user = $request->user();
        $code = $request->string('code')->toString();
        $method = $user->two_factor_method ?? TwoFactorMethod::Totp;

        if ($user->two_factor_confirmed_at !== null) {
            throw ValidationException::withMessages([
                'two_factor' => ['A autenticação em duas etapas já está ativa.'],
            ]);
        }

        if ($method === TwoFactorMethod::Email) {
            if (! $twoFactorEmailService->verifySetupCodeForCentralUser($user, $code)) {
                throw ValidationException::withMessages([
                    'code' => ['Código inválido.'],
                ]);
            }
        } else {
            if (! $user->two_factor_secret) {
                throw ValidationException::withMessages([
                    'two_factor' => ['Ative a autenticação em duas etapas antes de confirmar.'],
                ]);
            }

            $secret = Crypt::decryptString($user->two_factor_secret);

            if (! Google2FA::verifyKey($secret, $code)) {
                throw ValidationException::withMessages([
                    'code' => ['Código inválido.'],
                ]);
            }
        }

        $user->update([
            'two_factor_confirmed_at' => now(),
        ]);

        $freshUser = $user->fresh();
        $twoFactorSyncService->syncFromCentralUser($freshUser);

        return response()->json([
            'status' => 1,
            'message' => 'MSG000425',
            'description' => 'Autenticação em duas etapas confirmada!',
            'result' => [
                'method' => ($freshUser->two_factor_method ?? TwoFactorMethod::Totp)->value,
                'recovery_codes' => $this->decryptRecoveryCodes($freshUser),
            ],
        ]);
    }

    public function resendSetupCode(Request $request, TwoFactorEmailService $twoFactorEmailService): JsonResponse
    {
        /** @var CentralUser $user */
        $user = $request->user();

        if (($user->two_factor_method ?? null) !== TwoFactorMethod::Email) {
            throw ValidationException::withMessages([
                'two_factor' => ['Reenvio disponível apenas para autenticação por e-mail.'],
            ]);
        }

        if ($user->two_factor_confirmed_at !== null) {
            throw ValidationException::withMessages([
                'two_factor' => ['A autenticação em duas etapas já está ativa.'],
            ]);
        }

        $twoFactorEmailService->sendSetupCodeForCentralUser($user);

        return response()->json([
            'status' => 1,
            'message' => 'MSG000425',
            'description' => 'Código reenviado com sucesso.',
            'result' => [
                'masked_email' => MasksEmail::mask($user->email),
            ],
        ]);
    }

    public function disable(
        Request $request,
        TwoFactorSyncService $twoFactorSyncService,
        UserPasswordVerificationService $userPasswordVerificationService,
    ): JsonResponse {
        $request->validate([
            'password' => ['required', 'string'],
        ]);

        /** @var CentralUser $user */
        $user = $request->user();

        $userPasswordVerificationService->verifyCentralCurrentPassword(
            $user,
            $request->string('password')->toString(),
        );

        $user->update([
            'two_factor_method' => null,
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ]);

        $twoFactorSyncService->clearForCentralUser($user);

        return response()->json([
            'status' => 1,
            'message' => 'MSG000425',
            'description' => 'Autenticação em duas etapas desativada.',
            'result' => null,
        ]);
    }

    public function recoveryCodes(Request $request, TwoFactorSyncService $twoFactorSyncService): JsonResponse
    {
        /** @var CentralUser $user */
        $user = $request->user();

        if ($user->two_factor_confirmed_at === null) {
            throw ValidationException::withMessages([
                'two_factor' => ['Ative a autenticação em duas etapas antes de continuar.'],
            ]);
        }

        $twoFactorSyncService->syncFromCentralUser($user);

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'result' => [
                'method' => ($user->two_factor_method ?? TwoFactorMethod::Totp)->value,
                'recovery_codes' => $this->decryptRecoveryCodes($user),
            ],
        ]);
    }

    public function regenerateRecoveryCodes(Request $request, TwoFactorSyncService $twoFactorSyncService): JsonResponse
    {
        /** @var CentralUser $user */
        $user = $request->user();

        if ($user->two_factor_confirmed_at === null) {
            throw ValidationException::withMessages([
                'two_factor' => ['Ative a autenticação em duas etapas antes de continuar.'],
            ]);
        }

        $recoveryCodes = $this->generateRecoveryCodes();

        $user->update([
            'two_factor_recovery_codes' => Crypt::encryptString(json_encode($recoveryCodes)),
        ]);

        $twoFactorSyncService->syncRecoveryCodesToTenantUsers($user->fresh());

        return response()->json([
            'status' => 1,
            'message' => 'MSG000425',
            'result' => [
                'recovery_codes' => $recoveryCodes,
            ],
        ]);
    }

    /**
     * @return array<int, string>
     */
    private function generateRecoveryCodes(): array
    {
        return collect(range(1, 8))
            ->map(fn (): string => Str::upper(Str::random(10)))
            ->all();
    }

    /**
     * @return array<int, string>
     */
    private function decryptRecoveryCodes(CentralUser $user): array
    {
        if (! $user->two_factor_recovery_codes) {
            return [];
        }

        /** @var array<int, string> $codes */
        $codes = json_decode(Crypt::decryptString($user->two_factor_recovery_codes), true);

        return $codes;
    }
}
