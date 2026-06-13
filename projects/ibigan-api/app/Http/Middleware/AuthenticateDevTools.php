<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\Central\CentralUser;
use App\Models\MultiTenantPersonalAccessToken;
use App\Models\Tenant;
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

        $this->initializeTenancyFromSession($request);

        if ($this->authenticateFromSanctumToken($request)) {
            if ($this->shouldRedirectWithoutQuery($request)) {
                return redirect()->to($request->url());
            }

            return $next($request);
        }

        $this->initializeTenancyFromSession($request);

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

    private function shouldRedirectWithoutQuery(Request $request): bool
    {
        return $request->query('access_token') !== null
            || $request->query('tenant_id') !== null;
    }

    private function initializeTenancyFromSession(Request $request): void
    {
        $tenantId = $request->query('tenant_id') ?? session('dev_tools_tenant_id');

        if (! is_string($tenantId) || $tenantId === '') {
            return;
        }

        if (tenancy()->initialized && tenancy()->tenant?->getTenantKey() === $tenantId) {
            return;
        }

        $tenant = Tenant::find($tenantId);

        if ($tenant) {
            tenancy()->initialize($tenant);
        }
    }

    private function authenticateFromSanctumToken(Request $request): bool
    {
        $plainToken = $request->bearerToken() ?? $request->query('access_token');

        if (! is_string($plainToken) || $plainToken === '') {
            return false;
        }

        $tenantId = $request->query('tenant_id');

        if (! is_string($tenantId) || $tenantId === '') {
            $tenantId = session('dev_tools_tenant_id');
        }

        if (is_string($tenantId) && $tenantId !== '') {
            $this->initializeTenancyFromSession($request);
        }

        $accessToken = MultiTenantPersonalAccessToken::findTokenForDevTools(
            $plainToken,
            is_string($tenantId) ? $tenantId : null,
        );

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

            $resolvedTenantId = tenancy()->initialized ? tenancy()->tenant?->getTenantKey() : null;
            if (is_string($resolvedTenantId) && $resolvedTenantId !== '') {
                $request->session()->put('dev_tools_tenant_id', $resolvedTenantId);
            } else {
                $request->session()->forget('dev_tools_tenant_id');
            }

            $request->session()->forget('dev_tools_central_user_id');

            return true;
        }

        if ($tokenable instanceof CentralUser) {
            if (tenancy()->initialized) {
                tenancy()->end();
            }

            $request->session()->put('dev_tools_central_user_id', $tokenable->id);
            $request->session()->forget('dev_tools_tenant_id');
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
