<?php

declare(strict_types=1);

namespace App\Data;

use App\Models\Central\PlatformTranslation;
use Spatie\LaravelData\Data;

final class TenantTranslationData extends Data
{
    public function __construct(
        public int $id,
        public string $key,
        public string $locale,
        public string $value,
        public bool $is_active,
        public string $created_at,
        public string $updated_at,
    ) {}

    public static function fromModel(PlatformTranslation $translation): self
    {
        return new self(
            id: $translation->id,
            key: $translation->key,
            locale: $translation->locale,
            value: $translation->value,
            is_active: $translation->is_active,
            created_at: $translation->created_at->toIso8601String(),
            updated_at: $translation->updated_at->toIso8601String(),
        );
    }
}
