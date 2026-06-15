<?php

declare(strict_types=1);

use App\Models\Central\TenantUser;
use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\Concerns\SeedsPlatformTenantSuperAdmins;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Database\Seeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    cleanupTenantDatabaseFiles('alpha', 'beta');

    foreach (['alpha', 'beta'] as $tenantId) {
        Tenant::create([
            'id' => $tenantId,
            'slug' => $tenantId,
            'name' => strtoupper($tenantId),
            'is_active' => true,
        ]);
    }

    $seeder = new class extends Seeder
    {
        use SeedsPlatformTenantSuperAdmins;

        public function run(): void
        {
            foreach (['alpha', 'beta'] as $tenantId) {
                $tenant = Tenant::query()->find($tenantId);
                $tenant?->run(function () use ($tenantId): void {
                    $this->call(RolePermissionSeeder::class);
                    $this->seedPlatformTenantSuperAdmins($tenantId, 'alpha');
                });
            }
        }
    };

    $seeder->run();
});

afterEach(function (): void {
    cleanupTenantDatabaseFiles('alpha', 'beta');
});

it('cria super-admins da plataforma em todos os tenants com ids fixos', function (): void {
    foreach (['alpha', 'beta'] as $tenantId) {
        Tenant::find($tenantId)?->run(function (): void {
            $hemily = User::query()->where('email', 'hemily.monteiro01@gmail.com')->first();

            expect($hemily)->not->toBeNull()
                ->and($hemily->id)->toBe(9001)
                ->and($hemily->is_super_admin)->toBeTrue()
                ->and($hemily->hasRole('super-admin'))->toBeTrue();
        });
    }
});

it('vincula super-admins da plataforma a multiplas empresas', function (): void {
    $links = TenantUser::query()
        ->where('user_id', 9001)
        ->orderBy('tenant_id')
        ->get();

    expect($links)->toHaveCount(2)
        ->and($links->pluck('tenant_id')->all())->toBe(['alpha', 'beta'])
        ->and($links->firstWhere('tenant_id', 'alpha')?->is_default)->toBeTrue();
});

it('lista todas as empresas vinculadas apos login', function (): void {
    $hemily = Tenant::find('alpha')?->run(
        fn (): User => User::query()->where('email', 'hemily.monteiro01@gmail.com')->firstOrFail(),
    );

    Sanctum::actingAs($hemily, ['*'], 'sanctum');

    $this->getJson('/api/central/v1/tenants')
        ->assertOk()
        ->assertJsonCount(2, 'result')
        ->assertJsonPath('result.0.id', 'alpha')
        ->assertJsonPath('result.1.id', 'beta');
});
