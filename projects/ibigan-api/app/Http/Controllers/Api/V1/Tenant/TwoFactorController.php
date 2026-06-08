<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use PragmaRX\Google2FALaravel\Facade as Google2FA;

final class TwoFactorController extends Controller
{
    /**
     * Iniciar configuração de autenticação em duas etapas.
     *
     * Gera secret, QR code e recovery codes. Requer confirmação via OTP.
     */
    public function enable(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->two_factor_confirmed_at !== null) {
            throw ValidationException::withMessages([
                'two_factor' => ['A autenticação em duas etapas já está ativa.'],
            ]);
        }

        $secret = Google2FA::generateSecretKey();
        $recoveryCodes = $this->generateRecoveryCodes();

        $user->update([
            'two_factor_secret' => Crypt::encryptString($secret),
            'two_factor_recovery_codes' => Crypt::encryptString(json_encode($recoveryCodes)),
            'two_factor_confirmed_at' => null,
        ]);

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'result' => [
                'secret' => $secret,
                'qr_code_url' => Google2FA::getQRCodeUrl(config('app.name'), $user->email, $secret),
                'recovery_codes' => $recoveryCodes,
            ],
        ]);
    }

    /**
     * Confirmar 2FA com código OTP do aplicativo autenticador.
     */
    public function confirm(Request $request): JsonResponse
    {
        $request->validate([
            'code' => ['required', 'string'],
        ]);

        $user = $request->user();

        if (! $user->two_factor_secret) {
            throw ValidationException::withMessages([
                'two_factor' => ['Ative a autenticação em duas etapas antes de confirmar.'],
            ]);
        }

        $secret = Crypt::decryptString($user->two_factor_secret);

        if (! Google2FA::verifyKey($secret, $request->string('code')->toString())) {
            throw ValidationException::withMessages([
                'code' => ['Código inválido.'],
            ]);
        }

        $user->update([
            'two_factor_confirmed_at' => now(),
        ]);

        return response()->json([
            'status' => 1,
            'message' => 'MSG000425',
            'description' => 'Autenticação em duas etapas confirmada!',
            'result' => [
                'recovery_codes' => $this->decryptRecoveryCodes($user->fresh()),
            ],
        ]);
    }

    /**
     * Desativar autenticação em duas etapas.
     *
     * Requer senha atual do usuário.
     */
    public function disable(Request $request): JsonResponse
    {
        $request->validate([
            'password' => ['required', 'string', 'current_password'],
        ]);

        $request->user()->update([
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ]);

        return response()->json([
            'status' => 1,
            'message' => 'MSG000425',
            'description' => 'Autenticação em duas etapas desativada.',
            'result' => null,
        ]);
    }

    /**
     * Retornar recovery codes do 2FA.
     */
    public function recoveryCodes(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user->two_factor_secret) {
            throw ValidationException::withMessages([
                'two_factor' => ['Ative a autenticação em duas etapas antes de continuar.'],
            ]);
        }

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'result' => [
                'recovery_codes' => $this->decryptRecoveryCodes($user),
            ],
        ]);
    }

    /**
     * Gerar novos recovery codes e invalidar os anteriores.
     */
    public function regenerateRecoveryCodes(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user->two_factor_secret) {
            throw ValidationException::withMessages([
                'two_factor' => ['Ative a autenticação em duas etapas antes de continuar.'],
            ]);
        }

        $recoveryCodes = $this->generateRecoveryCodes();

        $user->update([
            'two_factor_recovery_codes' => Crypt::encryptString(json_encode($recoveryCodes)),
        ]);

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
    private function decryptRecoveryCodes(User $user): array
    {
        if (! $user->two_factor_recovery_codes) {
            return [];
        }

        /** @var array<int, string> $codes */
        $codes = json_decode(Crypt::decryptString($user->two_factor_recovery_codes), true);

        return $codes;
    }
}
