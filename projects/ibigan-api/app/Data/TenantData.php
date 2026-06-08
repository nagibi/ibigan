<?php

declare(strict_types=1);

namespace App\Data;

use App\Models\Tenant;
use Spatie\LaravelData\Data;

final class TenantData extends Data
{
    public function __construct(
        public string $id,
        public string $slug,
        public ?string $name,
        public bool $is_default,
    ) {}

    public static function fromModel(Tenant $tenant, bool $isDefault = false): self
    {
        return new self(
            id: $tenant->id,
            slug: $tenant->slug,
            name: $tenant->name,
            is_default: $isDefault,
        );
    }
}
