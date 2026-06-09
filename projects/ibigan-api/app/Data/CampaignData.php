<?php

declare(strict_types=1);

namespace App\Data;

use App\Models\Campaign;
use Spatie\LaravelData\Data;

final class CampaignData extends Data
{
    public function __construct(
        public int $id,
        public string $name,
        public ?string $description,
        public ?int $template_id,
        public ?string $subject,
        public ?string $body,
        /** @var array<int, string>|null */
        public ?array $channels,
        public string $status,
        public bool $is_active,
        public string $type,
        public ?string $scheduled_at,
        public ?string $started_at,
        public ?string $finished_at,
        /** @var array<string, int>|null */
        public ?array $stats,
        public int $created_by,
        public string $created_at,
    ) {}

    public static function fromModel(Campaign $campaign): self
    {
        return new self(
            id: $campaign->id,
            name: $campaign->name,
            description: $campaign->description,
            template_id: $campaign->template_id,
            subject: $campaign->subject,
            body: $campaign->body,
            channels: $campaign->channels,
            status: $campaign->status->value,
            is_active: (bool) $campaign->is_active,
            type: $campaign->type->value,
            scheduled_at: $campaign->scheduled_at?->toIso8601String(),
            started_at: $campaign->started_at?->toIso8601String(),
            finished_at: $campaign->finished_at?->toIso8601String(),
            stats: $campaign->stats,
            created_by: $campaign->created_by,
            created_at: $campaign->created_at->toIso8601String(),
        );
    }
}
