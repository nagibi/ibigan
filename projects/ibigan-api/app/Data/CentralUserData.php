<?php

declare(strict_types=1);

namespace App\Data;

use App\Models\Central\CentralUser;
use Spatie\LaravelData\Data;

final class CentralUserData extends Data
{
    public function __construct(
        public int $id,
        public string $name,
        public string $email,
        public bool $is_super_admin,
        public bool $is_active,
        public string $created_at,
        public ?string $updated_at,
    ) {}

    public static function fromModel(CentralUser $user): self
    {
        return new self(
            id: $user->id,
            name: $user->name,
            email: $user->email,
            is_super_admin: (bool) $user->is_super_admin,
            is_active: (bool) $user->is_active,
            created_at: $user->created_at->toIso8601String(),
            updated_at: $user->updated_at?->toIso8601String(),
        );
    }
}
