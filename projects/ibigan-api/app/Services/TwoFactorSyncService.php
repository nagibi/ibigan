<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Central\CentralUser;
use App\Models\Tenant;
use App\Models\User;

final class TwoFactorSyncService
{
    public function syncFromTenantUser(User $tenantUser): void
    {
        if ($tenantUser->two_factor_confirmed_at === null || ! $tenantUser->two_factor_secret) {
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
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ]);
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
