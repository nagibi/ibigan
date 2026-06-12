<?php

declare(strict_types=1);

use App\Models\Tenant;
use App\Models\TenantTranslation;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $tenantId = 'tenant-'.uniqid();
    $this->tenant = Tenant::create([
        'id' => $tenantId,
        'slug' => $tenantId,
        'name' => 'Test Corp',
    ]);

    $this->tenant->run(function (): void {
        $this->seed(RolePermissionSeeder::class);
    });

    $this->user = $this->tenant->run(function (): User {
        $user = User::factory()->create([
            'email' => 'admin@test.com',
            'password' => bcrypt('password123'),
        ]);
        $user->assignRole('admin');

        return $user;
    });

    $this->headers = ['X-Tenant-ID' => $this->tenant->id];
});

afterEach(function (): void {
    tenancy()->end();
    $databasePath = database_path('ibigan_tenant_'.$this->tenant->id);
    if (file_exists($databasePath)) {
        unlink($databasePath);
    }
});

it('lista sobrescritas publicas por locale', function (): void {
    $this->tenant->run(function (): void {
        TenantTranslation::query()->create([
            'key' => 'menu.users',
            'locale' => 'pt',
            'value' => 'Colaboradores',
            'is_active' => true,
        ]);
    });

    $response = $this->getJson('/api/v1/translations?locale=pt', $this->headers)
        ->assertOk()
        ->assertJsonPath('result.locale', 'pt');

    expect($response->json('result.overrides')['menu.users'])->toBe('Colaboradores');
});

it('gerencia traducoes com permissao de configuracao', function (): void {
    Sanctum::actingAs($this->user);

    $this->getJson('/api/v1/translations/manage', $this->headers)
        ->assertOk()
        ->assertJsonPath('status', 1);

    $this->postJson('/api/v1/translations', [
        'key' => 'menu.users',
        'locale' => 'en',
        'value' => 'Collaborators',
        'is_active' => true,
    ], $this->headers)
        ->assertCreated()
        ->assertJsonPath('message_code', 'translation.created_successfully')
        ->assertJsonPath('result.key', 'menu.users')
        ->assertJsonPath('result.value', 'Collaborators');
});
