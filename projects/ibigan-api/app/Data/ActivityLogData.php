<?php

declare(strict_types=1);

namespace App\Data;

use Spatie\Activitylog\Models\Activity;
use Spatie\LaravelData\Data;

final class ActivityLogData extends Data
{
    public function __construct(
        public int $id,
        public ?string $log_name,
        public string $description,
        public ?string $subject_type,
        public ?int $subject_id,
        public ?string $causer_type,
        public ?int $causer_id,
        public ?string $causer_name,
        /** @var array<string, mixed> */
        public array $properties,
        public string $created_at,
    ) {}

    public static function fromModel(Activity $activity): self
    {
        return new self(
            id: $activity->id,
            log_name: $activity->log_name,
            description: $activity->description,
            subject_type: $activity->subject_type,
            subject_id: $activity->subject_id,
            causer_type: $activity->causer_type,
            causer_id: $activity->causer_id,
            causer_name: $activity->causer?->name,
            properties: $activity->properties?->toArray() ?? [],
            created_at: $activity->created_at->toIso8601String(),
        );
    }
}
