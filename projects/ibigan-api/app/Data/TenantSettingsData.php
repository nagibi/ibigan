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
        public string $registration_mode,
        public bool $require_email_verification,
        public bool $require_admin_approval,
        public bool $require_2fa,
        /** @var array<int, string> */
        public array $allowed_email_domains,
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
            logo_url: $tenant->logo_url ?: null,
            registration_mode: $tenant->registration_mode,
            require_email_verification: $tenant->require_email_verification,
            require_admin_approval: $tenant->require_admin_approval,
            require_2fa: $tenant->require_2fa,
            allowed_email_domains: $tenant->allowed_email_domains,
            created_at: $tenant->created_at->toIso8601String(),
        );
    }
}
