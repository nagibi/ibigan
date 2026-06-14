<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Auth;

use App\Actions\Auth\ForgotPasswordAction;
use App\Actions\Auth\RegisterAction;
use App\Actions\Auth\ResetPasswordAction;
use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Models\Tenant;
use App\Models\User;
use App\Enums\TwoFactorMethod;
use App\Services\TwoFactorEmailService;
use App\Support\MasksEmail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
final class AuthController extends Controller
{
    /**
     * Autenticar usuário no tenant.
     *
     * Retorna token de acesso e dados do usuário.
     * Se 2FA estiver ativo, retorna `requires_2fa: true` sem token.
     */
    public function login(Request $request, TwoFactorEmailService $twoFactorEmailService): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'tenant_id' => ['required', 'string'],
        ]);

        $tenant = Tenant::find($request->tenant_id);

        if (! $tenant) {
            return ApiResponse::error(
                'auth.login.tenant_not_found',
                errors: [['field' => 'tenant_id', 'message_code' => 'auth.login.tenant_not_found']],
                httpStatus: Response::HTTP_UNPROCESSABLE_ENTITY,
            );
        }

        tenancy()->initialize($tenant);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return ApiResponse::error(
                'auth.login.invalid_credentials',
                errors: [['field' => 'email', 'message_code' => 'auth.login.invalid_credentials']],
                httpStatus: Response::HTTP_UNAUTHORIZED,
            );
        }

        if ($user->two_factor_confirmed_at !== null) {
            $twoFactorToken = Str::uuid()->toString();
            $method = $user->two_factor_method ?? TwoFactorMethod::Totp;

            $twoFactorEmailService->storeChallenge($twoFactorToken, [
                'scope' => 'tenant',
                'user_id' => $user->id,
                'tenant_id' => $tenant->id,
                'method' => $method->value,
            ]);

            if ($method === TwoFactorMethod::Email) {
                $twoFactorEmailService->sendLoginCodeForUser($user, $twoFactorToken);
            }

            return ApiResponse::success(
                [
                    'requires_2fa' => true,
                    'two_factor_token' => $twoFactorToken,
                    'two_factor_method' => $method->value,
                    'masked_email' => MasksEmail::mask($user->email),
                    'tenant_id' => $tenant->id,
                ],
                'auth.login.two_factor_required',
                severity: 'info',
            );
        }

        $token = $user->createToken('api-token')->plainTextToken;
        $request->setUserResolver(fn () => $user);

        return ApiResponse::success(
            [
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
            'auth.login.success',
            severity: 'success',
        );
    }

    /**
     * Retornar dados do usuário autenticado.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $tenant = tenant();

        return ApiResponse::success([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'roles' => $user->getRoleNames(),
            'permissions' => $user->getAllPermissions()->pluck('name'),
            'tenant' => $tenant ? [
                'id' => (string) $tenant->id,
                'slug' => (string) $tenant->slug,
                'name' => $tenant->name,
            ] : null,
        ]);
    }

    /**
     * Encerrar sessão e invalidar o token atual.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return ApiResponse::success(null, 'auth.logout.success', severity: 'success');
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
