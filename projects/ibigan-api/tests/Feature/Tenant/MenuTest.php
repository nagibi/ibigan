<?php

declare(strict_types=1);

use App\Models\Menu;
use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $tenantId = 'tenant-'.uniqid();
    /** @var TestCase&object{tenant: Tenant, admin: User, viewer: User} $this */
    $this->tenant = Tenant::create([
        'id' => $tenantId,
        'slug' => $tenantId,
        'name' => 'Test Corp',
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

function menuHeaders(string $tenantId): array
{
    return ['X-Tenant-ID' => $tenantId];
}

function menuPayload(array $overrides = []): array
{
    return array_merge([
        'title' => 'Dashboard',
        'slug' => 'dashboard',
        'icon' => 'LayoutDashboard',
        'path' => '/dashboard',
        'target' => '_self',
        'order' => 0,
        'is_active' => true,
        'requires_auth' => true,
        'roles' => ['admin', 'viewer'],
    ], $overrides);
}

// --- Index ---

it('retorna árvore de menus para quem tem permissão', function (): void {
    $this->tenant->run(function (): void {
        $parent = Menu::factory()->create(['title' => 'Gestão', 'slug' => 'gestao', 'order' => 0]);
        Menu::factory()->create(['title' => 'Usuários', 'slug' => 'usuarios', 'parent_id' => $parent->id, 'order' => 1]);
    });

    Sanctum::actingAs($this->viewer, ['*'], 'sanctum');

    $this->getJson('/api/v1/menus', menuHeaders($this->tenant->id))
        ->assertOk()
        ->assertJsonPath('status', 1)
        ->assertJsonStructure([
            'result' => [['id', 'title', 'slug', 'children']],
        ]);
});

it('nega listagem sem autenticação', function (): void {
    $this->getJson('/api/v1/menus', menuHeaders($this->tenant->id))
        ->assertUnauthorized();
});

// --- Show ---

it('retorna um menu específico', function (): void {
    $menu = $this->tenant->run(fn () => Menu::factory()->create());

    Sanctum::actingAs($this->viewer, ['*'], 'sanctum');

    $this->getJson("/api/v1/menus/{$menu->id}", menuHeaders($this->tenant->id))
        ->assertOk()
        ->assertJsonPath('result.slug', $menu->slug);
});

it('retorna 404 para menu inexistente', function (): void {
    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $this->getJson('/api/v1/menus/999', menuHeaders($this->tenant->id))
        ->assertNotFound();
});

// --- Store ---

it('cria menu para quem tem permissão de gerenciar', function (): void {
    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $this->postJson('/api/v1/menus', menuPayload(), menuHeaders($this->tenant->id))
        ->assertCreated()
        ->assertJsonPath('status', 1)
        ->assertJsonPath('result.slug', 'dashboard');
});

it('nega criação para viewer', function (): void {
    Sanctum::actingAs($this->viewer, ['*'], 'sanctum');

    $this->postJson('/api/v1/menus', menuPayload(), menuHeaders($this->tenant->id))
        ->assertForbidden();
});

it('nega criação com slug duplicado', function (): void {
    $this->tenant->run(fn () => Menu::factory()->create(['slug' => 'dashboard']));

    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $this->postJson('/api/v1/menus', menuPayload(), menuHeaders($this->tenant->id))
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['slug']);
});

it('cria menu filho com parent_id válido', function (): void {
    $parent = $this->tenant->run(fn () => Menu::factory()->create(['slug' => 'gestao']));

    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $this->postJson('/api/v1/menus', menuPayload([
        'slug' => 'usuarios',
        'parent_id' => $parent->id,
    ]), menuHeaders($this->tenant->id))
        ->assertCreated()
        ->assertJsonPath('result.parent_id', $parent->id);
});

// --- Update ---

it('atualiza menu para quem tem permissão', function (): void {
    $menu = $this->tenant->run(fn () => Menu::factory()->create());

    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $this->putJson("/api/v1/menus/{$menu->id}", menuPayload([
        'slug' => $menu->slug,
        'title' => 'Dashboard Atualizado',
    ]), menuHeaders($this->tenant->id))
        ->assertOk()
        ->assertJsonPath('result.title', 'Dashboard Atualizado');
});

it('nega atualização para viewer', function (): void {
    $menu = $this->tenant->run(fn () => Menu::factory()->create());

    Sanctum::actingAs($this->viewer, ['*'], 'sanctum');

    $this->putJson("/api/v1/menus/{$menu->id}", menuPayload([
        'slug' => $menu->slug,
    ]), menuHeaders($this->tenant->id))
        ->assertForbidden();
});

// --- Destroy ---

it('remove menu para quem tem permissão', function (): void {
    $menu = $this->tenant->run(fn () => Menu::factory()->create());

    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $this->deleteJson("/api/v1/menus/{$menu->id}", [], menuHeaders($this->tenant->id))
        ->assertOk();
});

it('nega remoção para viewer', function (): void {
    $menu = $this->tenant->run(fn () => Menu::factory()->create());

    Sanctum::actingAs($this->viewer, ['*'], 'sanctum');

    $this->deleteJson("/api/v1/menus/{$menu->id}", [], menuHeaders($this->tenant->id))
        ->assertForbidden();
});

// --- Reorder ---

it('reordena menus para quem tem permissão', function (): void {
    [$m1, $m2, $m3] = $this->tenant->run(fn () => Menu::factory()->count(3)->create());

    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $this->patchJson('/api/v1/menus/reorder', [
        'items' => [
            ['id' => $m1->id, 'order' => 2],
            ['id' => $m2->id, 'order' => 0],
            ['id' => $m3->id, 'order' => 1],
        ],
    ], menuHeaders($this->tenant->id))
        ->assertOk()
        ->assertJsonPath('status', 1);
});

it('nega reorder para viewer', function (): void {
    $menu = $this->tenant->run(fn () => Menu::factory()->create());

    Sanctum::actingAs($this->viewer, ['*'], 'sanctum');

    $this->patchJson('/api/v1/menus/reorder', [
        'items' => [['id' => $menu->id, 'order' => 0]],
    ], menuHeaders($this->tenant->id))
        ->assertForbidden();
});
