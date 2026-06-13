<?php

declare(strict_types=1);

namespace App\Support;

final class TimezoneResolver
{
    public static function apply(string $timezone): void
    {
        if (! in_array($timezone, timezone_identifiers_list(), true)) {
            return;
        }

        config(['app.timezone' => $timezone]);
        date_default_timezone_set($timezone);
    }

    public static function applyDefault(): void
    {
        self::apply((string) config('app.default_timezone'));
    }
}
