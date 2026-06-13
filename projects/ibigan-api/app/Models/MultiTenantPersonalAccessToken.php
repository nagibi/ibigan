<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Central\CentralUser;
use App\Models\Tenant;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\PersonalAccessToken as SanctumPersonalAccessToken;

class MultiTenantPersonalAccessToken extends SanctumPersonalAccessToken
{
    protected $table = 'personal_access_tokens';

    public static function findToken($token)
    {
        $instance = parent::findToken($token);
        if ($instance) {
            return $instance;
        }

        return self::findCentralUserToken($token);
    }

    public static function findTokenForDevTools(string $token, ?string $tenantId = null): ?self
    {
        $centralToken = self::findCentralUserToken($token);
        if ($centralToken !== null) {
            return $centralToken;
        }

        if ($tenantId !== null && $tenantId !== '') {
            $tenant = Tenant::find($tenantId);
            if ($tenant) {
                tenancy()->initialize($tenant);

                $instance = parent::findToken($token);
                if ($instance !== null) {
                    return $instance;
                }
            }
        }

        foreach (Tenant::query()->cursor() as $tenant) {
            if ($tenantId !== null && $tenant->getTenantKey() === $tenantId) {
                continue;
            }

            tenancy()->initialize($tenant);

            $instance = parent::findToken($token);
            if ($instance !== null) {
                return $instance;
            }
        }

        return null;
    }

    private static function findCentralUserToken(string $token): ?self
    {
        try {
            $parts = explode('|', $token, 2);
            $id = $parts[0] ?? null;
            $plain = $parts[1] ?? null;
            if (! $id || ! $plain) {
                return null;
            }

            $record = DB::connection('central')
                ->table('personal_access_tokens')
                ->where('id', $id)
                ->first();

            if (! $record) {
                return null;
            }
            if (! hash_equals(hash('sha256', $plain), $record->token)) {
                return null;
            }
            if ($record->tokenable_type !== 'App\\Models\\Central\\CentralUser') {
                return null;
            }

            $model = CentralUser::find($record->tokenable_id);
            if (! $model) {
                return null;
            }

            $instance = new self();
            $instance->setRawAttributes((array) $record, true);
            $instance->exists = true;
            $instance->setConnection('central');
            $instance->setRelation('tokenable', $model);

            return $instance;
        } catch (\Exception) {
            return null;
        }
    }
}
