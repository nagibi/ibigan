<?php

declare(strict_types=1);

namespace App\Data;

use App\Models\Tenant;
use Spatie\LaravelData\Data;

final class TenantSettingsData extends Data
{
    public function __construct(
        public string $id,
        public ?string $name,
        public string $slug,
        public string $timezone,
        public string $locale,
        public ?string $logo_url,
        public string $created_at,
    ) {}

    public static function fromModel(Tenant $tenant): self
    {
        return new self(
            id: $tenant->id,
            name: $tenant->name,
            slug: $tenant->slug,
            timezone: $tenant->timezone ?? 'UTC',
            locale: $tenant->locale ?? 'pt_BR',
            logo_url: $tenant->getFirstMediaUrl('logo') ?: null,
            created_at: $tenant->created_at->toIso8601String(),
        );
    }
}
