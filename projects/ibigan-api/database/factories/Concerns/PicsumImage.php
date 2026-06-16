<?php

declare(strict_types=1);

namespace Database\Factories\Concerns;

final class PicsumImage
{
    public static function url(?int $seed = null, int $width = 96, int $height = 96): string
    {
        $random = $seed ?? fake()->numberBetween(1, 1000);

        return "https://picsum.photos/{$width}/{$height}?random={$random}";
    }
}
