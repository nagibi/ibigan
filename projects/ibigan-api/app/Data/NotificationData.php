<?php

declare(strict_types=1);

namespace App\Data;

use Illuminate\Notifications\DatabaseNotification;
use Spatie\LaravelData\Data;

final class NotificationData extends Data
{
    public function __construct(
        public string $id,
        public string $type,
        /** @var array<string, mixed> */
        public array $data,
        public ?string $read_at,
        public string $created_at,
    ) {}

    public static function fromModel(DatabaseNotification $notification): self
    {
        return new self(
            id: $notification->id,
            type: $notification->type,
            data: $notification->data,
            read_at: $notification->read_at?->toIso8601String(),
            created_at: $notification->created_at->toIso8601String(),
        );
    }
}
