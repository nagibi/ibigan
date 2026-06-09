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
        public bool $is_active,
        public ?string $avatar_url,
        /** @var array<int, string> */
        public array $roles,
        /** @var array<int, string> */
        public array $permissions,
        public string $created_at,
        public ?string $updated_at,
        public ?UserAuditRefData $created_by,
        public ?UserAuditRefData $updated_by,
    ) {}

    public static function fromModel(User $user): self
    {
        return new self(
            id: $user->id,
            name: $user->name,
            email: $user->email,
            status: $user->status,
            is_active: (bool) $user->is_active,
            avatar_url: $user->getFirstMediaUrl('avatar') ?: null,
            roles: $user->getRoleNames()->toArray(),
            permissions: $user->getAllPermissions()->pluck('name')->toArray(),
            created_at: $user->created_at->toIso8601String(),
            updated_at: $user->updated_at?->toIso8601String(),
            created_by: UserAuditRefData::fromModel($user->creator),
            updated_by: UserAuditRefData::fromModel($user->updater),
        );
    }
}
