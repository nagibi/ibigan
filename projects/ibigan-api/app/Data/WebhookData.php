<?php

declare(strict_types=1);

namespace App\Data;

use App\Models\Webhook;
use Spatie\LaravelData\Data;

final class WebhookData extends Data
{
    /**
     * @param  array<int, string>  $events
     */
    public function __construct(
        public int $id,
        public string $url,
        public array $events,
        public bool $is_active,
        public ?string $description,
        public string $created_at,
    ) {}

    public static function fromModel(Webhook $webhook): self
    {
        return new self(
            id: $webhook->id,
            url: $webhook->url,
            events: $webhook->events,
            is_active: $webhook->is_active,
            description: $webhook->description,
            created_at: $webhook->created_at->toIso8601String(),
        );
    }
}
