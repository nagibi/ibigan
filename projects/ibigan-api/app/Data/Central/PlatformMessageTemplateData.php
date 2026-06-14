<?php

declare(strict_types=1);

namespace App\Data\Central;

use App\Models\Central\PlatformMessageTemplate;
use Spatie\LaravelData\Data;

final class PlatformMessageTemplateData extends Data
{
    public function __construct(
        public int $id,
        public string $name,
        public string $slug,
        public string $subject,
        public string $body,
        /** @var array<int, string>|null */
        public ?array $merge_tags,
        public bool $is_active,
        public bool $is_system = true,
        public string $created_at,
        public string $updated_at,
    ) {}

    public static function fromModel(PlatformMessageTemplate $template): self
    {
        return new self(
            id: $template->id,
            name: $template->name,
            slug: $template->slug,
            subject: $template->subject,
            body: $template->body,
            merge_tags: $template->merge_tags,
            is_active: $template->is_active,
            is_system: true,
            created_at: ($template->created_at ?? now())->toIso8601String(),
            updated_at: ($template->updated_at ?? $template->created_at ?? now())->toIso8601String(),
        );
    }
}
