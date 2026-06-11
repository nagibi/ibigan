<?php

declare(strict_types=1);

use App\Models\Menu;
use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\MenuSeeder;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * @property Tenant $tenant
 * @property User $admin
 */
uses(RefreshDatabase::class);

beforeEach(function (): void {
    /** @var TestCase&object{tenant: Tenant, admin: User} $this */
    $tenantId = 'tenant-'.uniqid();

    $this->tenant = Tenant::create([
        'id' => $tenantId,
        'slug' => $tenantId,
        'name' => 'Search Tenant',
    ]);

    $this->tenant->run(function (): void {
        $this->seed(RolePermissionSeeder::class);
        $this->seed(MenuSeeder::class);
    });

    $this->admin = $this->tenant->run(function (): User {
        $user = User::factory()->create(['name' => 'Ana Busca']);
        $user->assignRole('admin');

        return $user;
    });

});

afterEach(function (): void {
    tenancy()->end();

    $databasePath = database_path('ibigan_tenant_'.$this->tenant->id);
    if (file_exists($databasePath)) {
        unlink($databasePath);
    }
});

function searchHeaders(string $tenantId): array
{
    return ['X-Tenant-ID' => $tenantId];
}

it('retorna resultados agrupados na busca global', function (): void {
    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $this->tenant->run(function (): void {
        Menu::query()->get()->each->searchable();
        User::query()->get()->each->searchable();
    });

    $response = $this->getJson('/api/v1/search?q=ana', searchHeaders($this->tenant->id))
        ->assertOk()
        ->assertJsonPath('status', 1);

    expect($response->json('result.users'))->not->toBeEmpty();
    expect($response->json('result.users.0.title'))->toBe('Ana Busca');
});

it('nega busca global sem autenticação', function (): void {
    $this->getJson('/api/v1/search?q=ana', searchHeaders($this->tenant->id))
        ->assertUnauthorized();
});

it('valida termo mínimo na busca global', function (): void {
    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $this->getJson('/api/v1/search?q=a', searchHeaders($this->tenant->id))
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['q']);
});
