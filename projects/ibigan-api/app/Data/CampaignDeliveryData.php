<?php

declare(strict_types=1);

namespace App\Data;

use App\Models\CampaignDelivery;
use Spatie\LaravelData\Data;

final class CampaignDeliveryData extends Data
{
    public function __construct(
        public int $id,
        public int $campaign_id,
        public ?int $user_id,
        public string $channel,
        public string $status,
        public ?string $recipient_email,
        public ?string $error_message,
        public ?string $queued_at,
        public ?string $sent_at,
        public ?string $opened_at,
        public string $created_at,
    ) {}

    public static function fromModel(CampaignDelivery $delivery): self
    {
        return new self(
            id: $delivery->id,
            campaign_id: $delivery->campaign_id,
            user_id: $delivery->user_id,
            channel: $delivery->channel->value,
            status: $delivery->status->value,
            recipient_email: $delivery->recipient_email,
            error_message: $delivery->error_message,
            queued_at: $delivery->queued_at?->toIso8601String(),
            sent_at: $delivery->sent_at?->toIso8601String(),
            opened_at: $delivery->opened_at?->toIso8601String(),
            created_at: $delivery->created_at->toIso8601String(),
        );
    }
}
