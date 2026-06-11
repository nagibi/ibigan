<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\Request;
use Sentry\State\Scope;

use function Sentry\configureScope;

final class SentryContext
{
    public static function applyFromRequest(Request $request): void
    {
        if (! app()->bound('sentry')) {
            return;
        }

        configureScope(function (Scope $scope) use ($request): void {
            self::applyTenant($scope);

            $user = $request->user();
            if ($user instanceof Authenticatable) {
                self::applyUser($scope, $user);
            }
        });
    }

    public static function applyForQueue(): void
    {
        if (! app()->bound('sentry') || ! tenancy()->initialized) {
            return;
        }

        configureScope(fn (Scope $scope) => self::applyTenant($scope));
    }

    private static function applyTenant(Scope $scope): void
    {
        if (! tenancy()->initialized) {
            return;
        }

        $tenant = tenant();

        $scope->setTag('tenant.id', (string) $tenant->getTenantKey());
        $scope->setContext('tenant', [
            'id' => $tenant->getTenantKey(),
            'slug' => $tenant->slug ?? null,
        ]);
    }

    private static function applyUser(Scope $scope, Authenticatable $user): void
    {
        $scope->setUser([
            'id' => (string) $user->getAuthIdentifier(),
            'email' => $user->email ?? null,
        ]);
    }
}
