<?php

declare(strict_types=1);

use App\Models\Tenant;
use App\Models\User;
use App\Models\UserPreference;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

uses(RefreshDatabase::class);

function makeTenantUserForPreferences(string $email): array
{
    $tenantId = 'prefs-' . uniqid();

    $tenant = Tenant::create([
        'id' => $tenantId,
        'slug' => $tenantId,
        'name' => 'Preferences Tenant',
    ]);

    $tenant->run(function () {
        test()->seed(RolePermissionSeeder::class);
    });

    $user = $tenant->run(function () use ($email): User {
        $user = User::factory()->create([
            'email' => $email,
            'password' => bcrypt('senha123'),
        ]);
        $user->assignRole('admin');

        return $user;
    });

    return ['tenant' => $tenant, 'user' => $user];
}

beforeEach(function (): void {
    /** @var TestCase&object{ctx: array} $this */
    $this->ctx = makeTenantUserForPreferences('prefs@example.com');
});

afterEach(function (): void {
    cleanupTenantDatabaseFiles($this->ctx['tenant']->id);
});

it('lista preferências do usuário autenticado', function (): void {
    Sanctum::actingAs($this->ctx['user'], ['*'], 'sanctum');

    $this->ctx['tenant']->run(function () {
        UserPreference::create([
            'user_id' => $this->ctx['user']->id,
            'key' => 'users.view',
            'value' => 'cards',
        ]);
    });

    $response = $this->getJson('/api/v1/user-preferences', [
        'X-Tenant-ID' => $this->ctx['tenant']->id,
    ]);

    $response->assertOk();
    expect($response->json('result'))->toMatchArray(['users.view' => 'cards']);
});

it('atualiza preferências de visualização', function (): void {
    Sanctum::actingAs($this->ctx['user'], ['*'], 'sanctum');

    $response = $this->patchJson('/api/v1/user-preferences', [
        'preferences' => [
            'users.view' => 'list',
            'roles.view' => 'cards',
        ],
    ], [
        'X-Tenant-ID' => $this->ctx['tenant']->id,
    ]);

    $response->assertOk();
    expect($response->json('result'))->toMatchArray([
        'users.view' => 'list',
        'roles.view' => 'cards',
    ]);
});

it('rejeita modo de visualização inválido', function (): void {
    Sanctum::actingAs($this->ctx['user'], ['*'], 'sanctum');

    $this->patchJson('/api/v1/user-preferences', [
        'preferences' => [
            'users.view' => 'invalid',
        ],
    ], [
        'X-Tenant-ID' => $this->ctx['tenant']->id,
    ])
        ->assertUnprocessable();
});
