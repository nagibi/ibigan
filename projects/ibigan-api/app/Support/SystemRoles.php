<?php

declare(strict_types=1);

namespace App\Support;

final class SystemRoles
{
    /** @var list<string> */
    public const NAMES = [
        'super-admin',
        'admin',
        'manager',
        'viewer',
    ];

    public static function isSystem(string $name): bool
    {
        return in_array($name, self::NAMES, true);
    }

    public static function permissionsAreLocked(string $name): bool
    {
        return $name === 'super-admin';
    }
}
