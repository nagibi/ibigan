<?php

declare(strict_types=1);

namespace App\Data;

use App\Models\User;
use Spatie\LaravelData\Data;

final class UserAuditRefData extends Data
{
    public function __construct(
        public int $id,
        public string $name,
    ) {}

    public static function fromModel(?User $user): ?self
    {
        if ($user === null) {
            return null;
        }

        return new self(
            id: $user->id,
            name: $user->name,
        );
    }
}
