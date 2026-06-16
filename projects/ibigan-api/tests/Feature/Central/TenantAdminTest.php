<?php

declare(strict_types=1);

use App\Models\Central\CentralUser;
use App\Models\Central\TenantUser;
use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * @property Tenant $tenant
 * @property Tenant $otherTenant
 * @property CentralUser $superUser
 * @property CentralUser $adminUser
 * @property array<int, string> $createdTenantIds
 */
uses(RefreshDatabase::class);

beforeEach(function (): void {
    /** @var TestCase&object{tenant: Tenant, otherTenant: Tenant, superUser: CentralUser, adminUser: CentralUser, createdTenantIds: array<int, string>} $this */
    cleanupTenantDatabaseFiles('acme', 'beta');

    $this->tenant = Tenant::create([
        'id' => 'acme',
        'slug' => 'acme',
        'name' => 'Acme Corp',
        'cnpj' => '11222333000181',
        'timezone' => 'UTC',
        'locale' => 'pt_BR',
    ]);

    $this->otherTenant = Tenant::create([
        'id' => 'beta',
        'slug' => 'beta',
        'name' => 'Beta Inc',
        'timezone' => 'America/Sao_Paulo',
        'locale' => 'pt_BR',
    ]);

    $this->tenant->run(function (): void {
        $this->seed(RolePermissionSeeder::class);
    });

    $this->superUser = CentralUser::create([
        'name' => 'Super Admin',
        'email' => 'super@ibigan.com',
        'password' => 'senha123',
        'is_super_admin' => true,
        'is_active' => true,
    ]);

    $this->adminUser = CentralUser::create([
        'name' => 'Common Admin',
        'email' => 'admin@ibigan.com',
        'password' => 'senha123',
        'is_super_admin' => false,
        'is_active' => true,
    ]);

    // popula contagem de usuários do tenant (para o teste users_count)
    $tenantUser = $this->tenant->run(function (): User {
        return User::factory()->create(['email' => 'membro@acme.com']);
    });

    TenantUser::create([
        'tenant_id' => $this->tenant->id,
        'user_id' => $tenantUser->id,
        'role' => 'admin',
        'is_default' => true,
        'joined_at' => now(),
    ]);

    $this->createdTenantIds = ['acme', 'beta'];
});

afterEach(function (): void {
    cleanupTenantDatabaseFiles(...$this->createdTenantIds);
});

function actingAsSuperAdmin(CentralUser $user): void
{
    Sanctum::actingAs($user, ['*'], 'central');
}

function actingAsAdmin(CentralUser $user): void
{
    Sanctum::actingAs($user, ['*'], 'central');
}

// --- Index ---

it('lista todos os tenants para super-admin', function (): void {
    actingAsSuperAdmin($this->superUser);

    $this->getJson('/api/central/v1/admin/tenants')
        ->assertOk()
        ->assertJsonPath('status', 1)
        ->assertJsonStructure([
            'result' => [
                'data' => [['id', 'name', 'slug', 'cnpj', 'timezone', 'locale', 'is_active', 'users_count', 'created_at', 'updated_at']],
                'meta' => ['total', 'current_page', 'last_page', 'per_page'],
            ],
        ])
        ->assertJsonPath('result.meta.total', 2);
});

it('nega listagem admin de tenants para admin comum', function (): void {
    actingAsAdmin($this->adminUser);

    $this->getJson('/api/central/v1/admin/tenants')
        ->assertForbidden();
});

it('nega listagem admin de tenants sem autenticação', function (): void {
    $this->getJson('/api/central/v1/admin/tenants')
        ->assertUnauthorized();
});

// --- Show ---

it('retorna detalhes de um tenant para super-admin', function (): void {
    actingAsSuperAdmin($this->superUser);

    $this->getJson('/api/central/v1/admin/tenants/acme')
        ->assertOk()
        ->assertJsonPath('status', 1)
        ->assertJsonPath('result.id', 'acme')
        ->assertJsonPath('result.name', 'Acme Corp')
        ->assertJsonPath('result.slug', 'acme');
});

it('retorna 404 para tenant inexistente', function (): void {
    actingAsSuperAdmin($this->superUser);

    $this->getJson('/api/central/v1/admin/tenants/inexistente')
        ->assertNotFound();
});

it('nega visualização de tenant para admin comum', function (): void {
    actingAsAdmin($this->adminUser);

    $this->getJson('/api/central/v1/admin/tenants/acme')
        ->assertForbidden();
});

// --- Store ---

it('cria tenant para super-admin', function (): void {
    actingAsSuperAdmin($this->superUser);

    $response = $this->postJson('/api/central/v1/admin/tenants', [
        'name' => 'Nova Empresa',
        'timezone' => 'America/Sao_Paulo',
        'locale' => 'pt_BR',
    ])
        ->assertCreated()
        ->assertJsonPath('status', 1)
        ->assertJsonPath('result.name', 'Nova Empresa');

    $tenantId = $response->json('result.id');
    expect($tenantId)->toStartWith('nova-empresa-');

    $this->createdTenantIds[] = $tenantId;

    expect(Tenant::find($tenantId))->not->toBeNull();

    Tenant::find($tenantId)->run(function (): void {
        expect(Role::where('name', 'admin')->exists())->toBeTrue();
    });
});

it('nega criação de tenant sem nome', function (): void {
    actingAsSuperAdmin($this->superUser);

    $this->postJson('/api/central/v1/admin/tenants', [])
        ->assertUnprocessable()
        ->assertJsonPath('message_code', 'validation.failed')
        ->assertJsonPath('errors.0.field', 'name');
});

it('nega criação de tenant para admin comum', function (): void {
    actingAsAdmin($this->adminUser);

    $this->postJson('/api/central/v1/admin/tenants', [
        'name' => 'Bloqueado',
    ])->assertForbidden();
});

// --- Update ---

it('atualiza tenant para super-admin', function (): void {
    actingAsSuperAdmin($this->superUser);

    $this->putJson('/api/central/v1/admin/tenants/beta', [
        'name' => 'Beta Atualizada',
        'timezone' => 'UTC',
    ])
        ->assertOk()
        ->assertJsonPath('status', 1)
        ->assertJsonPath('result.name', 'Beta Atualizada');

    expect(Tenant::find('beta')->name)->toBe('Beta Atualizada');
});

it('nega atualização de tenant para admin comum', function (): void {
    actingAsAdmin($this->adminUser);

    $this->putJson('/api/central/v1/admin/tenants/beta', [
        'name' => 'Tentativa',
    ])->assertForbidden();
});

// --- Destroy ---

it('remove tenant para super-admin', function (): void {
    actingAsSuperAdmin($this->superUser);

    $this->deleteJson('/api/central/v1/admin/tenants/beta')
        ->assertOk()
        ->assertJsonPath('status', 1)
        ->assertJsonPath('result', null);

    expect(Tenant::find('beta'))->toBeNull();
});

it('nega remoção de tenant para admin comum', function (): void {
    actingAsAdmin($this->adminUser);

    $this->deleteJson('/api/central/v1/admin/tenants/beta')
        ->assertForbidden();
});

it('alterna status ativo do tenant para super-admin', function (): void {
    actingAsSuperAdmin($this->superUser);

    $this->patchJson('/api/central/v1/admin/tenants/acme/toggle-active', [
        'is_active' => false,
    ])
        ->assertOk()
        ->assertJsonPath('status', 1)
        ->assertJsonPath('result.is_active', false);

    expect(Tenant::find('acme')->is_active)->toBeFalse();
});

it('retorna contagem de usuarios associados ao tenant', function (): void {
    actingAsSuperAdmin($this->superUser);

    $this->getJson('/api/central/v1/admin/tenants/acme')
        ->assertOk()
        ->assertJsonPath('result.users_count', 1);
});

it('lista activity logs do tenant para super-admin', function (): void {
    actingAsSuperAdmin($this->superUser);

    $this->getJson('/api/central/v1/admin/tenants/acme/activity-logs')
        ->assertOk()
        ->assertJsonPath('status', 1)
        ->assertJsonStructure([
            'result' => [
                'data',
                'meta' => ['total', 'current_page', 'last_page', 'per_page'],
            ],
        ]);
});

it('impersona tenant para super-admin e retorna token de tenant', function (): void {
    actingAsSuperAdmin($this->superUser);

    $response = $this->postJson('/api/central/v1/admin/tenants/acme/impersonate')
        ->assertOk()
        ->assertJsonPath('status', 1)
        ->assertJsonPath('result.tenant_id', 'acme')
        ->assertJsonPath('result.user.email', 'super@ibigan.com')
        ->assertJsonPath('result.user.is_platform_user', true)
        ->assertJsonStructure([
            'result' => [
                'token',
                'tenant_id',
                'user' => ['id', 'name', 'email', 'roles', 'permissions'],
            ],
        ]);

    expect($response->json('result.token'))->not->toBeEmpty();
    expect($response->json('result.user.roles'))->toContain('super-admin');
    expect($response->json('result.user.permissions'))->not->toBeEmpty();

    $this->tenant->run(function (): void {
        $user = User::where('email', 'super@ibigan.com')->where('is_platform_user', true)->first();
        expect($user)->not->toBeNull();
        expect($user->hasRole('super-admin'))->toBeTrue();
    });
});

it('nega impersonação de tenant para admin comum', function (): void {
    actingAsAdmin($this->adminUser);

    $this->postJson('/api/central/v1/admin/tenants/acme/impersonate')
        ->assertForbidden();
});

it('cria tenant com cnpj para super-admin', function (): void {
    actingAsSuperAdmin($this->superUser);

    $response = $this->postJson('/api/central/v1/admin/tenants', [
        'name' => 'Empresa CNPJ',
        'cnpj' => '04.252.011/0001-10',
        'timezone' => 'UTC',
        'locale' => 'pt_BR',
    ])
        ->assertCreated()
        ->assertJsonPath('result.cnpj', '04252011000110');

    $this->createdTenantIds[] = $response->json('result.id');
});

// --- Impersonation ---

it('super-admin impersona um tenant com sucesso', function (): void {
    actingAsSuperAdmin($this->superUser);

    $response = $this->postJson('/api/central/v1/admin/tenants/acme/impersonate')
        ->assertOk()
        ->assertJsonPath('status', 1)
        ->assertJsonPath('result.tenant_id', 'acme')
        ->assertJsonStructure([
            'result' => [
                'token',
                'tenant_id',
                'user' => ['id', 'name', 'email', 'is_platform_user', 'roles', 'permissions'],
            ],
        ]);

    expect($response->json('result.user.is_platform_user'))->toBeTrue();
    expect($response->json('result.user.roles'))->toContain('super-admin');
    expect($response->json('result.token'))->not->toBeEmpty();
});

it('cria o usuário-plataforma no banco do tenant ao impersonar', function (): void {
    actingAsSuperAdmin($this->superUser);

    $this->postJson('/api/central/v1/admin/tenants/acme/impersonate')->assertOk();

    $this->tenant->run(function (): void {
        $user = User::where('email', $this->superUser->email)
            ->where('is_platform_user', true)
            ->first();

        expect($user)->not->toBeNull();
        expect($user->hasRole('super-admin'))->toBeTrue();
    });
});

it('reutiliza o usuário-plataforma em impersonações repetidas', function (): void {
    actingAsSuperAdmin($this->superUser);

    $this->postJson('/api/central/v1/admin/tenants/acme/impersonate')->assertOk();
    $this->postJson('/api/central/v1/admin/tenants/acme/impersonate')->assertOk();

    $this->tenant->run(function (): void {
        $count = User::where('email', $this->superUser->email)
            ->where('is_platform_user', true)
            ->count();

        expect($count)->toBe(1);
    });
});

it('nega impersonação para usuário comum', function (): void {
    actingAsAdmin($this->adminUser);

    $this->postJson('/api/central/v1/admin/tenants/acme/impersonate')
        ->assertForbidden();
});

it('nega impersonação sem autenticação', function (): void {
    $this->postJson('/api/central/v1/admin/tenants/acme/impersonate')
        ->assertUnauthorized();
});

it('retorna 404 ao impersonar tenant inexistente', function (): void {
    actingAsSuperAdmin($this->superUser);

    $this->postJson('/api/central/v1/admin/tenants/inexistente/impersonate')
        ->assertNotFound();
});
