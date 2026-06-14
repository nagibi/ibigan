<?php

declare(strict_types=1);

use App\Models\Central\CentralUser;
use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

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

    $this->admin = $this->tenant->run(function (): User {
        $user = User::factory()->create([
            'email' => 'admin@test.com',
            'password' => bcrypt('password123'),
        ]);
        $user->assignRole('admin');

        return $user;
    });

    $this->viewer = $this->tenant->run(function (): User {
        $user = User::factory()->create([
            'email' => 'viewer@test.com',
            'password' => bcrypt('password123'),
        ]);
        $user->assignRole('viewer');

        return $user;
    });

    $this->superAdmin = CentralUser::create([
        'name' => 'Super Admin',
        'email' => 'super@ibigan.com',
        'password' => 'senha123',
        'is_super_admin' => true,
        'is_active' => true,
    ]);
});

afterEach(function (): void {
    cleanupTenantDatabaseFiles($this->tenant->id);
});

it('nega acesso anônimo à documentação da API', function (): void {
    $this->get('/docs/api')->assertForbidden();
});

it('nega acesso anônimo ao Horizon', function (): void {
    $this->get('/horizon')->assertForbidden();
});

it('nega acesso anônimo ao Telescope', function (): void {
    $this->get('/telescope')->assertForbidden();
});

it('nega acesso anônimo ao Log Viewer', function (): void {
    $this->get('/log-viewer')->assertForbidden();
});

it('nega acesso anônimo ao Clockwork', function (): void {
    $this->get('/clockwork')->assertForbidden();
});

it('permite admin do tenant com token e tenant_id', function (): void {
    $token = $this->tenant->run(fn (): string => $this->admin->createToken('api-token')->plainTextToken);

    $this->get("/docs/api?access_token={$token}&tenant_id={$this->tenant->id}")
        ->assertRedirect('/docs/api');

    $this->get('/docs/api')
        ->assertOk();
});

it('permite admin do tenant via cookie após redirect', function (): void {
    $token = $this->tenant->run(fn (): string => $this->admin->createToken('api-token')->plainTextToken);

    $this->get("/docs/api?access_token={$token}&tenant_id={$this->tenant->id}")
        ->assertRedirect('/docs/api')
        ->assertCookie('dev_tools_access_token')
        ->assertCookie('dev_tools_tenant_id');

    $this->withUnencryptedCookie('dev_tools_access_token', $token)
        ->withUnencryptedCookie('dev_tools_tenant_id', $this->tenant->id)
        ->get('/docs/api')
        ->assertOk();
});

it('permite admin do tenant com token sem tenant_id via busca nos tenants', function (): void {
    $token = $this->tenant->run(fn (): string => $this->admin->createToken('api-token')->plainTextToken);

    $this->get("/docs/api?access_token={$token}")
        ->assertRedirect('/docs/api');

    $this->get('/docs/api')
        ->assertOk();
});

it('nega viewer do tenant mesmo com token válido', function (): void {
    $token = $this->tenant->run(fn (): string => $this->viewer->createToken('api-token')->plainTextToken);

    $this->get("/docs/api?access_token={$token}&tenant_id={$this->tenant->id}")
        ->assertForbidden();
});

it('permite super-admin central com token', function (): void {
    $token = $this->superAdmin->createToken('central-api-token')->plainTextToken;

    $this->get("/horizon?access_token={$token}")
        ->assertRedirect('/horizon');

    $this->get("/telescope?access_token={$token}")
        ->assertRedirect('/telescope');

    $this->get("/log-viewer?access_token={$token}")
        ->assertRedirect('/log-viewer');

    $this->get("/clockwork?access_token={$token}")
        ->assertRedirect('/clockwork');
});

it('nega central user comum com token', function (): void {
    $user = CentralUser::create([
        'name' => 'Comum',
        'email' => 'comum@ibigan.com',
        'password' => 'senha123',
        'is_super_admin' => false,
        'is_active' => true,
    ]);

    $token = $user->createToken('central-api-token')->plainTextToken;

    $this->get("/docs/api?access_token={$token}")
        ->assertForbidden();
});
