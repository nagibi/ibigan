<?php

declare(strict_types=1);

use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Encerra tenancy, purga conexões e remove arquivos SQLite do tenant.
 *
 * @param  string  ...$tenantIds
 */
function cleanupTenantDatabaseFiles(string ...$tenantIds): void
{
    if (tenancy()->initialized) {
        tenancy()->end();
    }

    DB::purge('tenant');

    foreach ($tenantIds as $tenantId) {
        $basePath = database_path('ibigan_tenant_'.$tenantId);

        foreach ([$basePath, "{$basePath}-wal", "{$basePath}-shm"] as $path) {
            if (is_file($path)) {
                @unlink($path);
            }
        }
    }
}

pest()->extend(TestCase::class)
    ->in('Feature');

uses()
    ->afterEach(function (): void {
        if (tenancy()->initialized) {
            tenancy()->end();
        }

        DB::purge('tenant');
    })
    ->in('Feature');
