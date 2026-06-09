<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

final class GoogleAuthController extends Controller
{
    /**
     * Redirecionar para o Google OAuth.
     * Aceita tenant_id como query param para identificar o tenant após o callback.
     */
    public function redirect(Request $request): JsonResponse
    {
        $tenantId = $request->query('tenant_id');

        $url = Socialite::driver('google')
            ->with(['state' => $tenantId ?? ''])
            ->stateless()
            ->redirect()
            ->getTargetUrl();

        return response()->json([
            'status' => 1,
            'result' => ['url' => $url],
        ]);
    }

    /**
     * Callback do Google OAuth.
     */
    public function callback(Request $request): RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')->user();
            $tenantId = $request->query('state', '');

            // Se tem tenant_id, logar usuário existente neste tenant
            if ($tenantId) {
                $tenant = Tenant::find($tenantId);

                if (! $tenant) {
                    return redirect(config('app.frontend_url').'/auth/login?error=tenant_not_found');
                }

                $result = $tenant->run(function () use ($googleUser): array {
                    $user = User::where('email', $googleUser->getEmail())->first();

                    if (! $user) {
                        return ['error' => 'user_not_found'];
                    }

                    $token = $user->createToken('google-oauth')->plainTextToken;

                    return ['token' => $token, 'user' => $user];
                });

                if (isset($result['error'])) {
                    return redirect(config('app.frontend_url').'/auth/login?error='.$result['error']);
                }

                $token = $result['token'];
                $frontUrl = config('app.frontend_url');

                return redirect("{$frontUrl}/auth/callback?token={$token}&tenant_id={$tenantId}");
            }

            // Sem tenant_id — criar novo tenant (registro via Google)
            $tenantSlug = Str::slug($googleUser->getName()).'-'.Str::random(6);
            $tenantName = $googleUser->getName()."'s Workspace";

            $tenant = Tenant::create([
                'id' => $tenantSlug,
                'slug' => $tenantSlug,
                'name' => $tenantName,
            ]);

            $token = $tenant->run(function () use ($googleUser): string {
                app(RolePermissionSeeder::class)->run();

                $user = User::create([
                    'name' => $googleUser->getName(),
                    'email' => $googleUser->getEmail(),
                    'password' => bcrypt(Str::random(32)),
                ]);

                $user->assignRole('admin');

                return $user->createToken('google-oauth')->plainTextToken;
            });

            $frontUrl = config('app.frontend_url');

            return redirect("{$frontUrl}/auth/callback?token={$token}&tenant_id={$tenantSlug}");
        } catch (\Exception $e) {
            \Log::error('Google OAuth error: '.$e->getMessage().' '.$e->getTraceAsString());

            return redirect(config('app.frontend_url').'/auth/login?error=oauth_failed&msg='.urlencode($e->getMessage()));
        }
    }
}
