<?php

declare(strict_types=1);

namespace App\Data;

use App\Models\Organization;
use Spatie\LaravelData\Data;

final class OrganizationData extends Data
{
    public function __construct(
        public int $id,
        public string $name,
        public string $slug,
        public ?string $cnpj,
        public string $status,
        public bool $is_active,
        public ?string $description,
        public ?string $logo_url,
        public ?string $logo_thumb_url,
        public string $created_at,
    ) {}

    public static function fromModel(Organization $organization): self
    {
        return new self(
            id: $organization->id,
            name: $organization->name,
            slug: $organization->slug,
            cnpj: $organization->cnpj,
            status: $organization->status->value,
            is_active: (bool) $organization->is_active,
            description: $organization->description,
            logo_url: $organization->getFirstMediaUrl('logo') ?: null,
            logo_thumb_url: $organization->getFirstMediaUrl('logo', 'thumb') ?: null,
            created_at: $organization->created_at->toIso8601String(),
        );
    }
}
