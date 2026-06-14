<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Central\CentralUser;
use App\Models\Tenant;
use App\Models\User;
use App\Notifications\TwoFactorCodeNotification;

final class TwoFactorEmailService
{
    public const CODE_TTL_SETUP = 10;

    public const CODE_TTL_LOGIN = 5;

    public function sendSetupCode(User $user): void
    {
        $code = $this->storeCode($this->setupCacheKey($user->id), self::CODE_TTL_SETUP);

        $user->notify(new TwoFactorCodeNotification(
            code: $code,
            expiresMinutes: self::CODE_TTL_SETUP,
            context: 'setup',
        ));
    }

    public function verifySetupCode(User $user, string $code): bool
    {
        return $this->verifyCode($this->setupCacheKey($user->id), $code);
    }

    public function sendLoginCodeForUser(User $user, string $challengeToken): void
    {
        $code = $this->storeCentralCode($this->loginCacheKey($challengeToken), self::CODE_TTL_LOGIN);

        $user->notify(new TwoFactorCodeNotification(
            code: $code,
            expiresMinutes: self::CODE_TTL_LOGIN,
            context: 'login',
        ));
    }

    public function sendLoginCodeForCentralUser(CentralUser $user, string $challengeToken): void
    {
        $code = $this->storeCentralCode($this->loginCacheKey($challengeToken), self::CODE_TTL_LOGIN);

        $this->runWithTenancyForEmail($user->email, function () use ($user, $code): void {
            $user->notify(new TwoFactorCodeNotification(
                code: $code,
                expiresMinutes: self::CODE_TTL_LOGIN,
                context: 'login',
            ));
        });
    }

    public function verifyLoginCode(string $challengeToken, string $code): bool
    {
        return $this->verifyCentralCode($this->loginCacheKey($challengeToken), $code);
    }

    public function verifyCentralLoginCode(string $challengeToken, string $code): bool
    {
        return $this->verifyCentralCode($this->loginCacheKey($challengeToken), $code);
    }

    public function resendLoginCode(User $user, string $challengeToken): void
    {
        $this->sendLoginCodeForUser($user, $challengeToken);
    }

    public function resendLoginCodeForCentralUser(CentralUser $user, string $challengeToken): void
    {
        $this->sendLoginCodeForCentralUser($user, $challengeToken);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function storeChallenge(string $token, array $payload, int $ttlMinutes = 5): void
    {
        $this->withoutTenancy(function () use ($token, $payload, $ttlMinutes): void {
            cache()->put($this->challengeCacheKey($token), $payload, now()->addMinutes($ttlMinutes));
        });
    }

    /**
     * @return array<string, mixed>|null
     */
    public function getChallenge(string $token): ?array
    {
        return $this->withoutTenancy(function () use ($token): ?array {
            $value = cache()->get($this->challengeCacheKey($token));

            return is_array($value) ? $value : null;
        });
    }

    public function forgetChallenge(string $token): void
    {
        $this->withoutTenancy(function () use ($token): void {
            cache()->forget($this->challengeCacheKey($token));
        });
    }

    private function challengeCacheKey(string $token): string
    {
        return 'two_factor:'.$token;
    }

    private function setupCacheKey(int $userId): string
    {
        return 'two_factor_setup_code:'.$userId;
    }

    private function loginCacheKey(string $challengeToken): string
    {
        return 'two_factor_login_code:'.$challengeToken;
    }

    private function storeCentralCode(string $cacheKey, int $ttlMinutes): string
    {
        return $this->withoutTenancy(fn (): string => $this->storeCode($cacheKey, $ttlMinutes));
    }

    private function verifyCentralCode(string $cacheKey, string $code): bool
    {
        return $this->withoutTenancy(fn (): bool => $this->verifyCode($cacheKey, $code));
    }

    /**
     * @template TReturn
     *
     * @param  callable(): TReturn  $callback
     * @return TReturn
     */
    private function withoutTenancy(callable $callback): mixed
    {
        $previousTenant = tenant();

        if ($previousTenant !== null) {
            tenancy()->end();
        }

        try {
            return $callback();
        } finally {
            if ($previousTenant !== null) {
                tenancy()->initialize($previousTenant);
            }
        }
    }

    private function storeCode(string $cacheKey, int $ttlMinutes): string
    {
        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        cache()->put($cacheKey, $code, now()->addMinutes($ttlMinutes));

        return $code;
    }

    private function verifyCode(string $cacheKey, string $code): bool
    {
        $stored = cache()->get($cacheKey);

        if (! is_string($stored) || ! hash_equals($stored, trim($code))) {
            return false;
        }

        cache()->forget($cacheKey);

        return true;
    }

    private function runWithTenancyForEmail(string $email, callable $callback): void
    {
        if (tenant()) {
            $callback();

            return;
        }

        foreach (Tenant::query()->cursor() as $tenant) {
            tenancy()->initialize($tenant);

            if (User::query()->where('email', $email)->exists()) {
                try {
                    $callback();
                } finally {
                    tenancy()->end();
                }

                return;
            }

            tenancy()->end();
        }

        $callback();
    }
}
