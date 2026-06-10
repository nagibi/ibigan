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
        $token = (string) $token;

        // Tentar no banco atual (tenant ou central)
        $instance = parent::findToken($token);

        if ($instance) {
            return $instance;
        }

        // Se não encontrou, tentar no banco central
        $instance = self::findTokenOnConnection('central', $token);

        if ($instance) {
            return $instance;
        }

        // Sem contexto de tenant, buscar nos bancos dos tenants
        if (tenant()) {
            return null;
        }

        foreach (Tenant::query()->cursor() as $tenant) {
            tenancy()->initialize($tenant);

            $instance = parent::findToken($token);

            if ($instance) {
                return $instance;
            }

            tenancy()->end();
        }

        return null;
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
