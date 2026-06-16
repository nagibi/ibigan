<?php

declare(strict_types=1);

namespace Database\Seeders\Concerns;

use Database\Factories\Concerns\PicsumImage;

trait SeedsEquipamentoDemoImages
{
    protected function seedEquipamentoImage(string $directory, string $label): string
    {
        unset($directory);

        return PicsumImage::url(crc32($label) % 1000 + 1);
    }
}
