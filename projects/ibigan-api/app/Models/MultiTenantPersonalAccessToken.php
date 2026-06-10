<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Central\CentralUser;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\PersonalAccessToken as SanctumPersonalAccessToken;

class MultiTenantPersonalAccessToken extends SanctumPersonalAccessToken
{
    protected $table = 'personal_access_tokens';

    public static function findToken($token)
    {
        // Banco atual (tenant inicializado pelo middleware)
        $instance = parent::findToken($token);
        if ($instance) {
            return $instance;
        }

        // Banco central (CentralUser tokens)
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
            if ($record->tokenable_type !== 'App\\Models\\Central\\CentralUser') {
                return null;
            }

            $model = CentralUser::find($record->tokenable_id);
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
}
