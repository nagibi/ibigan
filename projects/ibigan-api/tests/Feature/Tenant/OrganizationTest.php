<?php

declare(strict_types=1);

use App\Jobs\ExportOrganizationsJob;
use App\Models\Organization;
use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * @property Tenant $tenant
 * @property User $admin
 * @property User $viewer
 */
uses(RefreshDatabase::class);

beforeEach(function (): void {
    /** @var TestCase&object{tenant: Tenant, admin: User, viewer: User} $this */
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

it('retorna lista paginada de organizações para quem tem permissão de visualizar', function (): void {
    $this->tenant->run(fn () => Organization::factory()->count(3)->create());

    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $this->getJson('/api/v1/organizations', tenantHeaders($this->tenant->id))
        ->assertOk()
        ->assertJsonStructure([
            'status',
            'message',
            'result' => [
                'data' => [
                    ['id', 'name', 'slug', 'cnpj', 'status', 'description', 'created_at'],
                ],
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
            ],
        ])
        ->assertJsonPath('status', 1);
});

it('retorna uma organização específica para quem tem permissão de visualizar', function (): void {
    $organization = $this->tenant->run(fn () => Organization::factory()->create());

    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $this->getJson("/api/v1/organizations/{$organization->id}", tenantHeaders($this->tenant->id))
        ->assertOk()
        ->assertJsonPath('status', 1)
        ->assertJsonPath('result.id', $organization->id)
        ->assertJsonPath('result.slug', $organization->slug);
});

it('cria uma organização para quem tem permissão de gerenciar', function (): void {
    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $payload = [
        'name' => 'Nova Empresa',
        'slug' => 'nova-empresa',
        'cnpj' => '11222333000181',
        'description' => 'Descrição da empresa',
    ];

    $this->postJson('/api/v1/organizations', $payload, tenantHeaders($this->tenant->id))
        ->assertCreated()
        ->assertJsonPath('status', 1)
        ->assertJsonPath('result.name', 'Nova Empresa')
        ->assertJsonPath('result.slug', 'nova-empresa')
        ->assertJsonPath('result.cnpj', '11222333000181')
        ->assertJsonPath('result.status', 'active');

    $this->tenant->run(function () use ($payload): void {
        expect(Organization::where('slug', $payload['slug'])->exists())->toBeTrue();
    });
});

it('atualiza uma organização para quem tem permissão de gerenciar', function (): void {
    $organization = $this->tenant->run(fn () => Organization::factory()->create());

    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $payload = [
        'name' => 'Empresa Atualizada',
        'slug' => 'empresa-atualizada',
        'cnpj' => '19131243000197',
        'status' => 'inactive',
    ];

    $this->putJson("/api/v1/organizations/{$organization->id}", $payload, tenantHeaders($this->tenant->id))
        ->assertOk()
        ->assertJsonPath('status', 1)
        ->assertJsonPath('result.cnpj', '19131243000197')
        ->assertJsonPath('result.name', 'Empresa Atualizada')
        ->assertJsonPath('result.slug', 'empresa-atualizada')
        ->assertJsonPath('result.status', 'inactive');
});

it('remove uma organização para quem tem permissão de gerenciar', function (): void {
    $organization = $this->tenant->run(fn () => Organization::factory()->create());

    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $this->deleteJson("/api/v1/organizations/{$organization->id}", [], tenantHeaders($this->tenant->id))
        ->assertOk()
        ->assertJsonPath('status', 1)
        ->assertJsonPath('result', null);

    $this->tenant->run(function () use ($organization): void {
        expect(Organization::find($organization->id))->toBeNull();
    });
});

it('permite listar organizações para perfil viewer', function (): void {
    Sanctum::actingAs($this->viewer, ['*'], 'sanctum');

    $this->getJson('/api/v1/organizations', tenantHeaders($this->tenant->id))
        ->assertOk();
});

it('nega criação de organização para perfil viewer', function (): void {
    Sanctum::actingAs($this->viewer, ['*'], 'sanctum');

    $this->postJson('/api/v1/organizations', [
        'name' => 'Empresa Bloqueada',
        'slug' => 'empresa-bloqueada',
    ], tenantHeaders($this->tenant->id))
        ->assertForbidden();
});

it('nega atualização de organização para perfil viewer', function (): void {
    $organization = $this->tenant->run(fn () => Organization::factory()->create());

    Sanctum::actingAs($this->viewer, ['*'], 'sanctum');

    $this->putJson("/api/v1/organizations/{$organization->id}", [
        'name' => 'Atualização Bloqueada',
        'slug' => 'atualizacao-bloqueada',
    ], tenantHeaders($this->tenant->id))
        ->assertForbidden();
});

it('nega remoção de organização para perfil viewer', function (): void {
    $organization = $this->tenant->run(fn () => Organization::factory()->create());

    Sanctum::actingAs($this->viewer, ['*'], 'sanctum');

    $this->deleteJson("/api/v1/organizations/{$organization->id}", [], tenantHeaders($this->tenant->id))
        ->assertForbidden();
});

it('faz upload de logo para organização', function (): void {
    $organization = $this->tenant->run(fn () => Organization::factory()->create());

    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $logo = UploadedFile::fake()->image('logo.jpg', 200, 200);

    $response = $this->withHeaders(array_merge(tenantHeaders($this->tenant->id), ['Accept' => 'application/json']))
        ->post("/api/v1/organizations/{$organization->id}/logo", ['logo' => $logo])
        ->assertOk()
        ->assertJsonPath('status', 1)
        ->assertJsonStructure([
            'result' => ['id', 'name', 'slug', 'status', 'logo_url', 'logo_thumb_url', 'created_at'],
        ])
        ->assertJsonPath('result.id', $organization->id);

    expect($response->json('result.logo_url'))->not->toBeNull();
    expect($response->json('result.logo_thumb_url'))->not->toBeNull();
});

it('inicia exportação de organizações para quem tem permissão de gerenciar', function (): void {
    Queue::fake();

    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $this->getJson('/api/v1/organizations/export', tenantHeaders($this->tenant->id))
        ->assertOk()
        ->assertJsonPath('status', 1)
        ->assertJsonPath('message', 'MSG000067')
        ->assertJsonPath('result.message', 'Exportação iniciada. Você receberá uma notificação quando estiver pronta.');

    Queue::assertPushed(ExportOrganizationsJob::class);
});

it('nega exportação de organizações para perfil viewer', function (): void {
    Queue::fake();

    Sanctum::actingAs($this->viewer, ['*'], 'sanctum');

    $this->getJson('/api/v1/organizations/export', tenantHeaders($this->tenant->id))
        ->assertForbidden();

    Queue::assertNothingPushed();
});

it('nega upload de logo para perfil viewer', function (): void {
    $organization = $this->tenant->run(fn () => Organization::factory()->create());

    Sanctum::actingAs($this->viewer, ['*'], 'sanctum');

    $logo = UploadedFile::fake()->image('logo.jpg', 200, 200);

    $this->withHeaders(array_merge(tenantHeaders($this->tenant->id), ['Accept' => 'application/json']))
        ->post("/api/v1/organizations/{$organization->id}/logo", ['logo' => $logo])
        ->assertForbidden();
});

it('ativa registro', function (): void {
    $organization = $this->tenant->run(fn () => Organization::factory()->create([
        'is_active' => false,
        'status' => 'inactive',
    ]));

    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $this->patchJson("/api/v1/organizations/{$organization->id}/toggle-active", [
        'is_active' => true,
    ], tenantHeaders($this->tenant->id))
        ->assertOk()
        ->assertJsonPath('result.is_active', true)
        ->assertJsonPath('result.status', 'active');
});

it('inativa registro', function (): void {
    $organization = $this->tenant->run(fn () => Organization::factory()->create([
        'is_active' => true,
        'status' => 'active',
    ]));

    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $this->patchJson("/api/v1/organizations/{$organization->id}/toggle-active", [
        'is_active' => false,
    ], tenantHeaders($this->tenant->id))
        ->assertOk()
        ->assertJsonPath('result.is_active', false)
        ->assertJsonPath('result.status', 'inactive');
});

it('nega toggle para viewer', function (): void {
    $organization = $this->tenant->run(fn () => Organization::factory()->create());

    Sanctum::actingAs($this->viewer, ['*'], 'sanctum');

    $this->patchJson("/api/v1/organizations/{$organization->id}/toggle-active", [
        'is_active' => false,
    ], tenantHeaders($this->tenant->id))
        ->assertForbidden();
});
