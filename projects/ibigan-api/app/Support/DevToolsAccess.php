<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\Central\CentralUser;
use App\Models\User;
use Illuminate\Contracts\Auth\Authenticatable;

final class DevToolsAccess
{
    /**
     * @param  Authenticatable|null  $user
     */
    public static function userCanAccess(mixed $user): bool
    {
        if ($user === null) {
            return false;
        }

        if ($user instanceof CentralUser) {
            return (bool) $user->is_super_admin;
        }

        if ($user instanceof User) {
            return $user->hasAnyRole(['admin', 'super-admin']);
        }

        return false;
    }
}
