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
        public ?string $cpf,
        public ?string $phone,
        public ?string $birth_date,
        public ?string $gender,
        public ?string $bio,
        public ?string $status,
        public ?string $avatar_url,
        public bool $is_active,
        public ?string $last_login_at,
        public ?string $last_login_ip,
        public ?string $last_login_device,
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
            cpf: $user->cpf,
            phone: $user->phone,
            birth_date: $user->birth_date?->toDateString(),
            gender: $user->gender,
            bio: $user->bio,
            status: $user->status,
            avatar_url: $user->getFirstMediaUrl('avatar') ?: null,
            is_active: (bool) $user->is_active,
            last_login_at: $user->last_login_at?->toIso8601String(),
            last_login_ip: $user->last_login_ip,
            last_login_device: $user->last_login_device,
            roles: $user->getRoleNames()->toArray(),
            permissions: $user->getAllPermissions()->pluck('name')->toArray(),
            created_at: $user->created_at->toIso8601String(),
            updated_at: $user->updated_at?->toIso8601String(),
            created_by: UserAuditRefData::fromModel($user->creator),
            updated_by: UserAuditRefData::fromModel($user->updater),
        );
    }
}
