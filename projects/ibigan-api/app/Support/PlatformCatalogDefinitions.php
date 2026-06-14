<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\Central\PlatformMessageTemplate;
use App\Models\Central\PlatformReportTemplate;

final class PlatformCatalogDefinitions
{
    /**
     * @return list<array<string, mixed>>
     */
    public static function messageTemplates(): array
    {
        if (PlatformMessageTemplate::query()->exists()) {
            return PlatformMessageTemplate::query()
                ->orderBy('id')
                ->get()
                ->map(static fn (PlatformMessageTemplate $template): array => [
                    'name' => $template->name,
                    'slug' => $template->slug,
                    'subject' => $template->subject,
                    'body' => $template->body,
                    'merge_tags' => $template->merge_tags,
                    'is_active' => $template->is_active,
                ])
                ->all();
        }

        return SystemMessageTemplates::defaultDefinitions();
    }

    /**
     * @return list<array<string, mixed>>
     */
    public static function reportTemplates(): array
    {
        if (PlatformReportTemplate::query()->exists()) {
            return PlatformReportTemplate::query()
                ->orderBy('id')
                ->get()
                ->map(static fn (PlatformReportTemplate $template): array => [
                    'platform_key' => $template->platform_key,
                    'name' => $template->name,
                    'description' => $template->description,
                    'query' => $template->query,
                    'parameters' => $template->parameters,
                    'columns' => $template->columns,
                    'is_active' => $template->is_active,
                ])
                ->all();
        }

        return SystemReportTemplates::defaultDefinitions();
    }
}
