<?php

declare(strict_types=1);

namespace App\Data;

use App\Models\WebhookDelivery;
use Spatie\LaravelData\Data;

final class WebhookDeliveryData extends Data
{
    /**
     * @param  array<string, mixed>  $payload
     */
    public function __construct(
        public int $id,
        public string $event,
        public array $payload,
        public ?int $response_status,
        public ?string $response_body,
        public string $status,
        public int $attempts,
        public ?string $delivered_at,
        public string $created_at,
    ) {}

    public static function fromModel(WebhookDelivery $delivery): self
    {
        return new self(
            id: $delivery->id,
            event: $delivery->event,
            payload: $delivery->payload,
            response_status: $delivery->response_status,
            response_body: $delivery->response_body,
            status: $delivery->status,
            attempts: $delivery->attempts,
            delivered_at: $delivery->delivered_at?->toIso8601String(),
            created_at: $delivery->created_at->toIso8601String(),
        );
    }
}
