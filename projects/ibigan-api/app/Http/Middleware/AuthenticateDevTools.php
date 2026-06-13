<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\Central\CentralUser;
use App\Models\MultiTenantPersonalAccessToken;
use App\Models\User;
use App\Support\DevToolsAccess;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

final class AuthenticateDevTools
{
    public function handle(Request $request, Closure $next): Response
    {
        if (app()->environment('local')) {
            return $next($request);
        }

        if ($this->authenticateFromSanctumToken($request)) {
            if ($request->query('access_token')) {
                return redirect()->to($request->url());
            }

            return $next($request);
        }

        $webUser = Auth::guard('web')->user();

        if (DevToolsAccess::userCanAccess($webUser)) {
            return $next($request);
        }

        $centralUser = $this->centralUserFromSession();

        if (DevToolsAccess::userCanAccess($centralUser)) {
            return $next($request);
        }

        abort(Response::HTTP_FORBIDDEN);
    }

    private function authenticateFromSanctumToken(Request $request): bool
    {
        $plainToken = $request->bearerToken() ?? $request->query('access_token');

        if (! is_string($plainToken) || $plainToken === '') {
            return false;
        }

        $accessToken = MultiTenantPersonalAccessToken::findToken($plainToken);

        if ($accessToken === null) {
            return false;
        }

        $tokenable = $accessToken->tokenable;

        if (! DevToolsAccess::userCanAccess($tokenable)) {
            return false;
        }

        if ($tokenable instanceof User) {
            Auth::guard('web')->login($tokenable);
            $request->setUserResolver(static fn () => $tokenable);

            return true;
        }

        if ($tokenable instanceof CentralUser) {
            $request->session()->put('dev_tools_central_user_id', $tokenable->id);
            $request->setUserResolver(static fn () => $tokenable);

            return true;
        }

        return false;
    }

    private function centralUserFromSession(): ?CentralUser
    {
        $centralUserId = session('dev_tools_central_user_id');

        if (! is_numeric($centralUserId)) {
            return null;
        }

        return CentralUser::query()->find((int) $centralUserId);
    }
}
