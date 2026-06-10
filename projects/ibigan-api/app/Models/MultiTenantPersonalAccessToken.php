<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\PersonalAccessToken as SanctumPersonalAccessToken;

class MultiTenantPersonalAccessToken extends SanctumPersonalAccessToken
{
    protected $table = 'personal_access_tokens';

    /**
     * Busca o token no banco do tenant atual ou no banco central.
     */
    public static function findToken($token)
    {
        // Tentar no banco atual (tenant)
        $instance = parent::findToken($token);
        if ($instance) {
            return $instance;
        }

        // Tentar no banco central
        try {
            $parts = explode('|', $token, 2);
            $id    = $parts[0] ?? null;
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

            // Resolver tokenable
            $model = match ($record->tokenable_type) {
                'App\\Models\\Central\\CentralUser' =>
                \App\Models\Central\CentralUser::find($record->tokenable_id),
                default => null,
            };

            if (! $model) {
                return null;
            }

            $instance = new self();
            $instance->setRawAttributes((array) $record);
            $instance->setConnection('central');
            $instance->setRelation('tokenable', $model);

            return $instance;
        } catch (\Exception) {
            return null;
        }
    }

    private static function findTokenOnConnection(string $connection, string $token): ?self
    {
        try {
            $id    = explode('|', $token, 2)[0] ?? null;
            $plain = explode('|', $token, 2)[1] ?? null;

            if (! $id || ! $plain) {
                return null;
            }

            $record = DB::connection($connection)
                ->table('personal_access_tokens')
                ->where('id', $id)
                ->first();

            if (! $record) {
                return null;
            }

            if (! hash_equals(hash('sha256', $plain), $record->token)) {
                return null;
            }

            $model = new self();
            $model->setRawAttributes((array) $record);
            $model->setConnection($connection);

            return $model;
        } catch (\Exception) {
            return null;
        }
    }
}
