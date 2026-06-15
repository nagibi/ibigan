<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Tenant;
use Database\Seeders\Concerns\SeedsPlatformTenantSuperAdmins;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use SeedsPlatformTenantSuperAdmins;

    public function run(): void
    {
        $this->call(PlatformCatalogSeeder::class);

        $tenant = Tenant::updateOrCreate(
            ['id' => 'acme'],
            [
                'slug' => 'acme',
                'name' => 'Acme Corp',
                'cnpj' => '04252011000110',
                'timezone' => 'UTC',
                'locale' => 'pt_BR',
                'is_active' => true,
            ],
        );

        $tenant->domains()->updateOrCreate(
            ['domain' => 'acme.localhost'],
        );

        $tenant->run(function () {
            $this->call(RolePermissionSeeder::class);
            $this->call(MenuSeeder::class);

            $platformAdmins = $this->seedPlatformTenantSuperAdmins('acme', 'acme');

            $catalogSyncUser = $platformAdmins[0] ?? null;

            if ($catalogSyncUser !== null) {
                app(\App\Services\PlatformCatalogService::class)->sync($catalogSyncUser->id, force: true);
            }
        });
    }
}
