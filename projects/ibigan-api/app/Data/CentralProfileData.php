<?php

declare(strict_types=1);

namespace App\Data;

use App\Models\Central\CentralUser;
use Spatie\LaravelData\Data;

final class CentralProfileData extends Data
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
        public ?string $avatar_url,
        /** @var array<int, string> */
        public array $roles,
        public string $created_at,
    ) {}

    public static function fromModel(CentralUser $user): self
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
            avatar_url: $user->avatarUrl(),
            roles: $user->is_super_admin ? ['super-admin'] : ['central'],
            created_at: $user->created_at->toIso8601String(),
        );
    }
}
