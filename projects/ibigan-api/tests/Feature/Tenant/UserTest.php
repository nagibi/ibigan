<?php

declare(strict_types=1);

use App\Models\Tenant;
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
    ]);

    $this->tenant->run(function (): void {
        $this->seed(RolePermissionSeeder::class);
    });

    $this->admin = $this->tenant->run(function (): User {
        $user = User::factory()->create();
        $user->assignRole('admin');

        return $user;
    });

    $this->viewer = $this->tenant->run(function (): User {
        $user = User::factory()->create();
        $user->assignRole('viewer');

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

function tenantHeaders(string $tenantId): array
{
    return ['X-Tenant-ID' => $tenantId];
}

it('retorna lista paginada de usuários para quem tem permissão de visualizar', function (): void {
    $this->tenant->run(fn () => User::factory()->count(3)->create());

    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $this->getJson('/api/v1/users', tenantHeaders($this->tenant->id))
        ->assertOk()
        ->assertJsonStructure([
            'status',
            'message',
            'result' => [
                'data' => [
                    ['id', 'name', 'email', 'status', 'roles', 'permissions', 'created_at'],
                ],
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
            ],
        ])
        ->assertJsonPath('status', 1);
});

it('retorna um usuário específico para quem tem permissão de visualizar', function (): void {
    $targetUser = $this->tenant->run(fn () => User::factory()->create());

    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $this->getJson("/api/v1/users/{$targetUser->id}", tenantHeaders($this->tenant->id))
        ->assertOk()
        ->assertJsonPath('status', 1)
        ->assertJsonPath('result.id', $targetUser->id)
        ->assertJsonPath('result.email', $targetUser->email);
});

it('cria um usuário para quem tem permissão de gerenciar', function (): void {
    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $payload = [
        'name' => 'New User',
        'email' => 'newuser@example.com',
        'password' => 'Password1',
        'password_confirmation' => 'Password1',
        'role' => 'viewer',
    ];

    $this->postJson('/api/v1/users', $payload, tenantHeaders($this->tenant->id))
        ->assertCreated()
        ->assertJsonPath('status', 1)
        ->assertJsonPath('result.name', 'New User')
        ->assertJsonPath('result.email', 'newuser@example.com')
        ->assertJsonPath('result.roles', ['viewer']);

    $this->tenant->run(function () use ($payload): void {
        expect(User::where('email', $payload['email'])->exists())->toBeTrue();
    });
});

it('atualiza um usuário para quem tem permissão de gerenciar', function (): void {
    $targetUser = $this->tenant->run(fn () => User::factory()->create());

    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $payload = [
        'name' => 'Updated Name',
        'email' => 'updated@example.com',
    ];

    $this->putJson("/api/v1/users/{$targetUser->id}", $payload, tenantHeaders($this->tenant->id))
        ->assertOk()
        ->assertJsonPath('status', 1)
        ->assertJsonPath('result.name', 'Updated Name')
        ->assertJsonPath('result.email', 'updated@example.com');
});

it('remove um usuário para quem tem permissão de gerenciar', function (): void {
    $targetUser = $this->tenant->run(fn () => User::factory()->create());

    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $this->deleteJson("/api/v1/users/{$targetUser->id}", [], tenantHeaders($this->tenant->id))
        ->assertOk()
        ->assertJsonPath('status', 1)
        ->assertJsonPath('result', null);

    $this->tenant->run(function () use ($targetUser): void {
        expect(User::find($targetUser->id))->toBeNull();
    });
});

it('permite listar usuários para perfil viewer', function (): void {
    Sanctum::actingAs($this->viewer, ['*'], 'sanctum');

    $this->getJson('/api/v1/users', tenantHeaders($this->tenant->id))
        ->assertOk();
});

it('nega criação de usuário para perfil viewer', function (): void {
    Sanctum::actingAs($this->viewer, ['*'], 'sanctum');

    $this->postJson('/api/v1/users', [
        'name' => 'Blocked User',
        'email' => 'blocked@example.com',
        'password' => 'Password1',
        'password_confirmation' => 'Password1',
        'role' => 'viewer',
    ], tenantHeaders($this->tenant->id))
        ->assertForbidden();
});

it('nega atualização de usuário para perfil viewer', function (): void {
    $targetUser = $this->tenant->run(fn () => User::factory()->create());

    Sanctum::actingAs($this->viewer, ['*'], 'sanctum');

    $this->putJson("/api/v1/users/{$targetUser->id}", [
        'name' => 'Blocked Update',
        'email' => 'blocked-update@example.com',
    ], tenantHeaders($this->tenant->id))
        ->assertForbidden();
});

it('nega remoção de usuário para perfil viewer', function (): void {
    $targetUser = $this->tenant->run(fn () => User::factory()->create());

    Sanctum::actingAs($this->viewer, ['*'], 'sanctum');

    $this->deleteJson("/api/v1/users/{$targetUser->id}", [], tenantHeaders($this->tenant->id))
        ->assertForbidden();
});
