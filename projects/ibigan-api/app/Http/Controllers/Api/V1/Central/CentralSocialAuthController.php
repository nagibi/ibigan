<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Central;

use App\Http\Controllers\Api\V1\Auth\SocialAuthController;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;
use Symfony\Component\HttpFoundation\Response;

final class CentralSocialAuthController extends Controller
{
    private const PROVIDERS = ['google', 'apple'];

    public function redirect(Request $request, string $provider): JsonResponse
    {
        $this->assertProvider($provider);

        $driver = Socialite::driver($provider)
            ->with(['state' => SocialAuthController::CENTRAL_OAUTH_STATE])
            ->stateless();

        if ($provider === 'apple') {
            $driver->scopes(['name', 'email']);
        }

        $url = $driver->redirect()->getTargetUrl();

        return response()->json([
            'status' => 1,
            'result' => ['url' => $url],
        ]);
    }

    private function assertProvider(string $provider): void
    {
        if (! in_array($provider, self::PROVIDERS, true)) {
            abort(Response::HTTP_NOT_FOUND);
        }
    }
}
