<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Central\PlatformMessageTemplate;
use App\Models\Central\PlatformReportTemplate;
use App\Support\SystemMessageTemplates;
use App\Support\SystemReportTemplates;
use Illuminate\Database\Seeder;

final class PlatformCatalogSeeder extends Seeder
{
    public function run(): void
    {
        foreach (SystemMessageTemplates::defaultDefinitions() as $definition) {
            PlatformMessageTemplate::query()->updateOrCreate(
                ['slug' => $definition['slug']],
                [
                    'name' => $definition['name'],
                    'subject' => $definition['subject'],
                    'body' => $definition['body'],
                    'merge_tags' => $definition['merge_tags'],
                    'is_active' => $definition['is_active'],
                ],
            );
        }

        foreach (SystemReportTemplates::defaultDefinitions() as $definition) {
            PlatformReportTemplate::query()->updateOrCreate(
                ['platform_key' => $definition['platform_key']],
                [
                    'name' => $definition['name'],
                    'description' => $definition['description'],
                    'query' => $definition['query'],
                    'parameters' => $definition['parameters'],
                    'columns' => $definition['columns'],
                    'is_active' => $definition['is_active'],
                ],
            );
        }
    }
}
