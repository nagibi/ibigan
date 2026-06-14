<?php

declare(strict_types=1);

namespace App\Support;

final class MasksEmail
{
    public static function mask(string $email): string
    {
        if (! str_contains($email, '@')) {
            return '******';
        }

        [$local, $domain] = explode('@', $email, 2);
        $visible = mb_substr($local, 0, 1);
        $maskedLocal = str_repeat('*', max(4, mb_strlen($local) - 1)).$visible;

        return $maskedLocal.'@'.$domain;
    }
}
