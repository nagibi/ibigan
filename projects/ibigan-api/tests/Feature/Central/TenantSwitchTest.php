<?php

declare(strict_types=1);

use App\Models\Central\TenantUser;
use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\PersonalAccessToken;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    cleanupTenantDatabaseFiles('acme', 'beta');

    $this->tenant = Tenant::create([
        'id' => 'acme',
        'slug' => 'acme',
        'name' => 'Acme Corp',
    ]);

    $this->otherTenant = Tenant::create([
        'id' => 'beta',
        'slug' => 'beta',
        'name' => 'Beta Inc',
    ]);

    $this->tenant->run(function (): void {
        $this->seed(RolePermissionSeeder::class);
    });

    $this->superUser = $this->tenant->run(function (): User {
        $user = User::factory()->create([
            'email' => 'super@ibigan.com',
            'name' => 'Super Admin',
        ]);
        $user->assignRole('super-admin');

        return $user;
    });

    TenantUser::create([
        'tenant_id' => $this->tenant->id,
        'user_id' => $this->superUser->id,
        'role' => 'admin',
        'is_default' => true,
        'joined_at' => now(),
    ]);
});

afterEach(function (): void {
    cleanupTenantDatabaseFiles('acme', 'beta');
});

it('lista organizações disponíveis para o superusuário', function (): void {
    Sanctum::actingAs($this->superUser, ['*'], 'sanctum');

    $this->getJson('/api/central/v1/tenants')
        ->assertOk()
        ->assertJsonPath('status', 1)
        ->assertJsonCount(1, 'result')
        ->assertJsonPath('result.0.id', 'acme')
        ->assertJsonPath('result.0.slug', 'acme')
        ->assertJsonPath('result.0.name', 'Acme Corp')
        ->assertJsonPath('result.0.is_default', true);
});

it('lista organização atual quando usuário não possui vínculo em tenant_users', function (): void {
    $operator = $this->tenant->run(function (): User {
        $user = User::factory()->create();
        $user->assignRole('operator');

        return $user;
    });

    Sanctum::actingAs($operator, ['*'], 'sanctum');

    $this->getJson('/api/central/v1/tenants', ['X-Tenant-ID' => $this->tenant->id])
        ->assertOk()
        ->assertJsonPath('status', 1)
        ->assertJsonCount(1, 'result')
        ->assertJsonPath('result.0.id', 'acme')
        ->assertJsonPath('result.0.name', 'Acme Corp');
});

it('retorna novo token ao trocar de organização', function (): void {
    Sanctum::actingAs($this->superUser, ['*'], 'sanctum');

    $response = $this->postJson('/api/central/v1/tenants/switch', [
        'tenant_id' => 'acme',
    ]);

    $response
        ->assertOk()
        ->assertJsonPath('status', 1)
        ->assertJsonPath('result.tenant_id', 'acme')
        ->assertJsonStructure([
            'result' => ['token', 'tenant_id'],
        ]);

    expect($response->json('result.token'))->not->toBeEmpty();

    $this->tenant->run(function () use ($response): void {
        $tokenId = explode('|', $response->json('result.token'), 2)[0];

        expect(PersonalAccessToken::find($tokenId))->not->toBeNull();
    });
});

it('nega acesso a organização não vinculada ao usuário', function (): void {
    Sanctum::actingAs($this->superUser, ['*'], 'sanctum');

    $this->postJson('/api/central/v1/tenants/switch', [
        'tenant_id' => 'beta',
    ])->assertForbidden();
});
