<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\MessageTemplate;
use App\Models\ReportTemplate;
use App\Models\Tenant;
use App\Models\User;
use App\Support\SystemMessageTemplates;
use App\Support\SystemReportTemplates;

final class PlatformCatalogService
{
    public function syncMessageTemplates(bool $force = false): int
    {
        $count = 0;

        foreach (SystemMessageTemplates::definitions() as $definition) {
            $existing = MessageTemplate::withTrashed()
                ->where('slug', $definition['slug'])
                ->first();

            if ($existing !== null && $existing->trashed()) {
                $existing->restore();
            }

            if ($existing !== null && ! $force && $existing->is_system === false) {
                $existing->update(['is_system' => true]);
                $count++;

                continue;
            }

            MessageTemplate::updateOrCreate(
                ['slug' => $definition['slug']],
                [
                    'name' => $definition['name'],
                    'subject' => $definition['subject'],
                    'body' => $definition['body'],
                    'merge_tags' => $definition['merge_tags'],
                    'is_active' => $definition['is_active'],
                    'is_system' => true,
                ],
            );

            $count++;
        }

        return $count;
    }

    public function syncReportTemplates(?int $createdBy = null, bool $force = false): int
    {
        $createdBy ??= $this->resolveCatalogUserId();

        if ($createdBy === null) {
            return 0;
        }

        $count = 0;

        foreach (SystemReportTemplates::definitions() as $definition) {
            $platformKey = $definition['platform_key'];

            $existing = ReportTemplate::withTrashed()
                ->where('platform_key', $platformKey)
                ->first();

            if ($existing !== null && $existing->trashed()) {
                $existing->restore();
            }

            if ($existing !== null && ! $force && ! $existing->is_system) {
                $existing->update([
                    'platform_key' => $platformKey,
                    'is_system' => true,
                ]);
                $count++;

                continue;
            }

            ReportTemplate::updateOrCreate(
                ['platform_key' => $platformKey],
                [
                    'name' => $definition['name'],
                    'description' => $definition['description'],
                    'query' => $definition['query'],
                    'parameters' => $definition['parameters'],
                    'columns' => $definition['columns'],
                    'is_active' => $definition['is_active'],
                    'is_system' => true,
                    'created_by' => $existing?->created_by ?? $createdBy,
                ],
            );

            $count++;
        }

        return $count;
    }

    public function sync(?int $createdBy = null, bool $force = false): array
    {
        return [
            'message_templates' => $this->syncMessageTemplates($force),
            'report_templates' => $this->syncReportTemplates($createdBy, $force),
        ];
    }

    public function syncAllTenants(bool $force = true): int
    {
        $processed = 0;

        foreach (Tenant::query()->cursor() as $tenant) {
            $tenant->run(fn (): array => $this->sync(force: $force));
            $processed++;
        }

        if (tenancy()->initialized) {
            tenancy()->end();
        }

        return $processed;
    }

    private function resolveCatalogUserId(): ?int
    {
        $user = User::query()
            ->role(['super-admin', 'admin'])
            ->orderBy('id')
            ->first();

        return $user?->id ?? User::query()->orderBy('id')->value('id');
    }
}
