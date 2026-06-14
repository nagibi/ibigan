<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\TwoFactorMethod;
use App\Models\Central\CentralUser;
use App\Models\Tenant;
use App\Models\User;

final class TwoFactorSyncService
{
    public function syncFromTenantUser(User $tenantUser): void
    {
        if ($tenantUser->two_factor_confirmed_at === null) {
            return;
        }

        $centralUser = CentralUser::query()
            ->where('email', $tenantUser->email)
            ->where('is_active', true)
            ->first();

        if ($centralUser === null) {
            return;
        }

        $centralUser->update([
            'two_factor_method' => $tenantUser->two_factor_method ?? TwoFactorMethod::Totp,
            'two_factor_secret' => $tenantUser->two_factor_secret,
            'two_factor_recovery_codes' => $tenantUser->two_factor_recovery_codes,
            'two_factor_confirmed_at' => $tenantUser->two_factor_confirmed_at,
        ]);
    }

    public function clearForTenantUser(User $tenantUser): void
    {
        $centralUser = CentralUser::query()
            ->where('email', $tenantUser->email)
            ->first();

        if ($centralUser === null) {
            return;
        }

        $centralUser->update([
            'two_factor_method' => null,
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ]);
    }

    public function syncFromCentralUser(CentralUser $centralUser): void
    {
        if ($centralUser->two_factor_confirmed_at === null) {
            return;
        }

        Tenant::query()->each(function (Tenant $tenant) use ($centralUser): void {
            tenancy()->initialize($tenant);

            User::query()
                ->where('email', $centralUser->email)
                ->where('is_active', true)
                ->update([
                    'two_factor_method' => $centralUser->two_factor_method ?? TwoFactorMethod::Totp,
                    'two_factor_secret' => $centralUser->two_factor_secret,
                    'two_factor_recovery_codes' => $centralUser->two_factor_recovery_codes,
                    'two_factor_confirmed_at' => $centralUser->two_factor_confirmed_at,
                ]);

            tenancy()->end();
        });
    }

    public function clearForCentralUser(CentralUser $centralUser): void
    {
        Tenant::query()->each(function (Tenant $tenant) use ($centralUser): void {
            tenancy()->initialize($tenant);

            User::query()
                ->where('email', $centralUser->email)
                ->update([
                    'two_factor_method' => null,
                    'two_factor_secret' => null,
                    'two_factor_recovery_codes' => null,
                    'two_factor_confirmed_at' => null,
                ]);

            tenancy()->end();
        });
    }

    public function syncRecoveryCodesToTenantUsers(CentralUser $centralUser): void
    {
        if (! $centralUser->two_factor_recovery_codes) {
            return;
        }

        $encryptedCodes = $centralUser->two_factor_recovery_codes;

        Tenant::query()->each(function (Tenant $tenant) use ($centralUser, $encryptedCodes): void {
            tenancy()->initialize($tenant);

            User::query()
                ->where('email', $centralUser->email)
                ->whereNotNull('two_factor_confirmed_at')
                ->update(['two_factor_recovery_codes' => $encryptedCodes]);

            tenancy()->end();
        });
    }
}
