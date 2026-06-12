<?php

declare(strict_types=1);

namespace App\Data;

use Spatie\LaravelData\Data;
use Spatie\Permission\Models\Permission;

final class PermissionData extends Data
{
    public function __construct(
        public int $id,
        public string $name,
        public string $resource,
        public string $action,
    ) {}

    public static function fromModel(Permission $permission): self
    {
        [$resource, $action] = self::parseName($permission->name);

        return new self(
            id: $permission->id,
            name: $permission->name,
            resource: $resource,
            action: $action,
        );
    }

    /**
     * @return array{0: string, 1: string}
     */
    private static function parseName(string $name): array
    {
        $parts = explode('-', $name, 2);

        return [
            $parts[0] ?? $name,
            $parts[1] ?? '',
        ];
    }
}
