<?php

declare(strict_types=1);

namespace App\Data;

use App\Support\SystemRoles;
use Spatie\LaravelData\Data;
use Spatie\Permission\Models\Role;

final class RoleData extends Data
{
    /**
     * @param  array<int, string>  $permissions
     */
    public function __construct(
        public int $id,
        public string $name,
        public bool $is_system,
        public bool $permissions_locked,
        public array $permissions,
        public int $users_count,
        public string $created_at,
        public ?string $updated_at,
    ) {}

    public static function fromModel(Role $role): self
    {
        $role->loadMissing('permissions');

        return new self(
            id: $role->id,
            name: $role->name,
            is_system: SystemRoles::isSystem($role->name),
            permissions_locked: SystemRoles::permissionsAreLocked($role->name),
            permissions: $role->permissions->pluck('name')->sort()->values()->all(),
            users_count: $role->users()->count(),
            created_at: $role->created_at->toIso8601String(),
            updated_at: $role->updated_at?->toIso8601String(),
        );
    }
}
