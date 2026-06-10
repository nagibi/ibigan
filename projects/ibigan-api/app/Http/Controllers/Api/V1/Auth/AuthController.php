<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Auth;

use App\Actions\Auth\ForgotPasswordAction;
use App\Actions\Auth\RegisterAction;
use App\Actions\Auth\ResetPasswordAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class AuthController extends Controller
{
    /**
     * Autenticar usuário no tenant.
     *
     * Retorna token de acesso e dados do usuário.
     * Se 2FA estiver ativo, retorna `requires_2fa: true` sem token.
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'tenant_id' => ['required', 'string'],
        ]);

        $tenant = Tenant::find($request->tenant_id);

        if (! $tenant) {
            throw ValidationException::withMessages([
                'tenant_id' => ['Organização não encontrada.'],
            ]);
        }

        tenancy()->initialize($tenant);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['As credenciais informadas estão incorretas.'],
            ]);
        }

        if ($user->two_factor_confirmed_at !== null) {
            $twoFactorToken = Str::uuid()->toString();

            Cache::put('two_factor:'.$twoFactorToken, [
                'user_id' => $user->id,
                'tenant_id' => $tenant->id,
            ], now()->addMinutes(5));

            return response()->json([
                'status' => 1,
                'message' => 'MSG000067',
                'description' => 'Autenticação em duas etapas necessária.',
                'result' => [
                    'requires_2fa' => true,
                    'two_factor_token' => $twoFactorToken,
                    'tenant_id' => $tenant->id,
                ],
            ]);
        }

        $token = $user->createToken('api-token')->plainTextToken;
        $request->setUserResolver(fn () => $user);

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

    /**
     * Retornar dados do usuário autenticado.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'result' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->getRoleNames(),
                'permissions' => $user->getAllPermissions()->pluck('name'),
            ],
        ]);
    }

    /**
     * Encerrar sessão e invalidar o token atual.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'status' => 1,
            'message' => 'MSG000416',
            'description' => 'Logout efetuado com sucesso!',
            'result' => null,
        ]);
    }

    /**
     * Registrar novo tenant e usuário administrador.
     *
     * Cria o tenant, executa o seeder de roles/permissions e cria o usuário admin.
     */
    public function register(RegisterRequest $request, RegisterAction $action): JsonResponse
    {
        $result = $action->execute($request);

        return response()->json([
            'status' => 1,
            'message' => 'MSG000424',
            'description' => 'Conta criada com sucesso!',
            'result' => $result,
        ], Response::HTTP_CREATED);
    }

    /**
     * Solicitar link de redefinição de senha.
     *
     * Por segurança, sempre retorna sucesso mesmo se o email não existir.
     */
    public function forgotPassword(ForgotPasswordRequest $request, ForgotPasswordAction $action): JsonResponse
    {
        $action->execute($request);

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'description' => 'Se o e-mail existir, você receberá as instruções em breve.',
            'result' => null,
        ]);
    }

    /**
     * Redefinir senha usando token recebido por email.
     */
    public function resetPassword(ResetPasswordRequest $request, ResetPasswordAction $action): JsonResponse
    {
        $action->execute($request);

        return response()->json([
            'status' => 1,
            'message' => 'MSG000425',
            'description' => 'Senha redefinida com sucesso!',
            'result' => null,
        ]);
    }
}
