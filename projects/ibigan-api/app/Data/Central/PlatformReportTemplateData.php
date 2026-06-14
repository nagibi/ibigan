<?php

declare(strict_types=1);

namespace App\Data\Central;

use App\Models\Central\PlatformReportTemplate;
use Spatie\LaravelData\Data;

final class PlatformReportTemplateData extends Data
{
    public function __construct(
        public int $id,
        public string $platform_key,
        public string $name,
        public ?string $description,
        public string $query,
        /** @var array<int, array<string, mixed>>|null */
        public ?array $parameters,
        /** @var array<int, array<string, mixed>>|null */
        public ?array $columns,
        public bool $is_active,
        public bool $is_system = true,
        public string $created_at,
        public string $updated_at,
    ) {}

    public static function fromModel(PlatformReportTemplate $template): self
    {
        return new self(
            id: $template->id,
            platform_key: $template->platform_key,
            name: $template->name,
            description: $template->description,
            query: $template->query,
            parameters: $template->parameters,
            columns: $template->columns,
            is_active: $template->is_active,
            is_system: true,
            created_at: ($template->created_at ?? now())->toIso8601String(),
            updated_at: ($template->updated_at ?? $template->created_at ?? now())->toIso8601String(),
        );
    }
}
