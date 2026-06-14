<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Services\PlatformCatalogService;
use Illuminate\Database\Seeder;

final class SystemMessageTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(PlatformCatalogSeeder::class);
        app(PlatformCatalogService::class)->sync(force: true);
    }
}
