<?php

declare(strict_types=1);

namespace App\Data;

use App\Models\User;
use Spatie\LaravelData\Data;

final class UserData extends Data
{
    public function __construct(
        public int $id,
        public string $name,
        public string $email,
        public ?string $status,
        public ?string $avatar_url,
        /** @var array<int, string> */
        public array $roles,
        /** @var array<int, string> */
        public array $permissions,
        public string $created_at,
    ) {}

    public static function fromModel(User $user): self
    {
        return new self(
            id: $user->id,
            name: $user->name,
            email: $user->email,
            status: $user->status,
            avatar_url: $user->getFirstMediaUrl('avatar') ?: null,
            roles: $user->getRoleNames()->toArray(),
            permissions: $user->getAllPermissions()->pluck('name')->toArray(),
            created_at: $user->created_at->toIso8601String(),
        );
    }
}
