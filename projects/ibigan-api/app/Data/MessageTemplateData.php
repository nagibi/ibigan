<?php

declare(strict_types=1);

namespace App\Data;

use App\Models\MessageTemplate;
use Spatie\LaravelData\Data;

final class MessageTemplateData extends Data
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
        public string $created_at,
    ) {}

    public static function fromModel(MessageTemplate $messageTemplate): self
    {
        return new self(
            id: $messageTemplate->id,
            name: $messageTemplate->name,
            slug: $messageTemplate->slug,
            subject: $messageTemplate->subject,
            body: $messageTemplate->body,
            merge_tags: $messageTemplate->merge_tags,
            is_active: $messageTemplate->is_active,
            created_at: $messageTemplate->created_at->toIso8601String(),
        );
    }
}
