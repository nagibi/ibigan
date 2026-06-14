<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\Central\CentralUser;
use App\Models\User;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Facades\Auth;

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

    public static function canViewDevTools(mixed $user = null): bool
    {
        if (app()->environment('local')) {
            return true;
        }

        if (self::userCanAccess($user)) {
            return true;
        }

        if (self::userCanAccess(Auth::guard('web')->user())) {
            return true;
        }

        $centralUserId = session('dev_tools_central_user_id');

        if (! is_numeric($centralUserId)) {
            return false;
        }

        return self::userCanAccess(
            CentralUser::query()->find((int) $centralUserId),
        );
    }
}
