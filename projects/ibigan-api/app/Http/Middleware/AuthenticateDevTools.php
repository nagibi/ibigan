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
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\Response;

final class AuthenticateDevTools
{
    private const ACCESS_TOKEN_COOKIE = 'dev_tools_access_token';

    private const TENANT_ID_COOKIE = 'dev_tools_tenant_id';

    public function handle(Request $request, Closure $next): Response
    {
        if (app()->environment('local')) {
            return $next($request);
        }

        $this->initializeTenancyFromRequest($request);

        if ($this->authenticateFromSanctumToken($request)) {
            if ($this->shouldRedirectWithoutQuery($request)) {
                return redirect()->to($request->url());
            }

            return $next($request);
        }

        $this->initializeTenancyFromRequest($request);

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

    private function initializeTenancyFromRequest(Request $request): void
    {
        $tenantId = $this->resolveTenantId($request);

        if ($tenantId === null) {
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

    private function resolveTenantId(Request $request): ?string
    {
        $tenantId = $request->query('tenant_id')
            ?? session('dev_tools_tenant_id')
            ?? $request->cookie(self::TENANT_ID_COOKIE);

        if (! is_string($tenantId) || $tenantId === '') {
            return null;
        }

        return $tenantId;
    }

    private function resolvePlainToken(Request $request): ?string
    {
        $bearerToken = $request->bearerToken();
        if (is_string($bearerToken) && $bearerToken !== '') {
            return $bearerToken;
        }

        $queryToken = $request->query('access_token');
        if (is_string($queryToken) && $queryToken !== '') {
            return $queryToken;
        }

        $cookieToken = $request->cookie(self::ACCESS_TOKEN_COOKIE);
        if (is_string($cookieToken) && $cookieToken !== '') {
            return $cookieToken;
        }

        return null;
    }

    private function authenticateFromSanctumToken(Request $request): bool
    {
        $plainToken = $this->resolvePlainToken($request);

        if ($plainToken === null) {
            return false;
        }

        $tenantId = $this->resolveTenantId($request);

        if ($tenantId !== null) {
            $this->initializeTenancyFromRequest($request);
        }

        $accessToken = MultiTenantPersonalAccessToken::findTokenForDevTools(
            $plainToken,
            $tenantId,
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
                $this->queueTenantCookie($request, $resolvedTenantId);
            } else {
                $request->session()->forget('dev_tools_tenant_id');
                $this->forgetTenantCookie();
            }

            $request->session()->forget('dev_tools_central_user_id');
            $this->queueAccessTokenCookie($request, $plainToken);

            return true;
        }

        if ($tokenable instanceof CentralUser) {
            if (tenancy()->initialized) {
                tenancy()->end();
            }

            $request->session()->put('dev_tools_central_user_id', $tokenable->id);
            $request->session()->forget('dev_tools_tenant_id');
            $request->setUserResolver(static fn () => $tokenable);
            $this->queueAccessTokenCookie($request, $plainToken);
            $this->forgetTenantCookie();

            return true;
        }

        return false;
    }

    private function queueAccessTokenCookie(Request $request, string $plainToken): void
    {
        cookie()->queue($this->makeCookie(
            $request,
            self::ACCESS_TOKEN_COOKIE,
            $plainToken,
        ));
    }

    private function queueTenantCookie(Request $request, string $tenantId): void
    {
        cookie()->queue($this->makeCookie(
            $request,
            self::TENANT_ID_COOKIE,
            $tenantId,
        ));
    }

    private function forgetTenantCookie(): void
    {
        cookie()->queue(cookie()->forget(self::TENANT_ID_COOKIE));
    }

    private function makeCookie(Request $request, string $name, string $value): Cookie
    {
        return cookie(
            $name,
            $value,
            config('session.lifetime', 120),
            '/',
            config('session.domain'),
            $request->isSecure(),
            true,
            false,
            config('session.same_site', 'lax'),
        );
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
