<?php

declare(strict_types=1);

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

afterEach(function (): void {
    tenancy()->end();
});

// --- Register ---

it('cria tenant e usuário admin com dados válidos', function (): void {
    $this->postJson('/api/v1/auth/register', [
        'company_name' => 'Minha Empresa',
        'name' => 'João Silva',
        'email' => 'joao@empresa.com',
        'password' => 'senha123',
        'password_confirmation' => 'senha123',
    ])
        ->assertCreated()
        ->assertJsonPath('status', 1)
        ->assertJsonStructure([
            'result' => [
                'token',
                'tenant_id',
                'user' => ['id', 'name', 'email', 'roles', 'permissions'],
            ],
        ])
        ->assertJsonPath('result.user.email', 'joao@empresa.com');
});

it('retorna tenant_id baseado no nome da empresa', function (): void {
    $response = $this->postJson('/api/v1/auth/register', [
        'company_name' => 'Acme Corp',
        'name' => 'Admin',
        'email' => 'admin@acme.com',
        'password' => 'senha123',
        'password_confirmation' => 'senha123',
    ])->assertCreated();

    expect($response->json('result.tenant_id'))->toStartWith('acme-corp-');
});

it('usuário criado recebe role admin', function (): void {
    $response = $this->postJson('/api/v1/auth/register', [
        'company_name' => 'Nova Empresa',
        'name' => 'Dono',
        'email' => 'dono@nova.com',
        'password' => 'senha123',
        'password_confirmation' => 'senha123',
    ])->assertCreated();

    $tenantId = $response->json('result.tenant_id');
    $tenant = Tenant::find($tenantId);

    $tenant->run(function (): void {
        $user = User::where('email', 'dono@nova.com')->first();
        expect($user->hasRole('admin'))->toBeTrue();
    });
});

it('nega register sem campos obrigatórios', function (): void {
    $this->postJson('/api/v1/auth/register', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['company_name', 'name', 'email', 'password']);
});

it('nega register com senha fraca', function (): void {
    $this->postJson('/api/v1/auth/register', [
        'company_name' => 'Empresa',
        'name' => 'Admin',
        'email' => 'admin@empresa.com',
        'password' => '123',
        'password_confirmation' => '123',
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['password']);
});

it('nega register sem confirmação de senha', function (): void {
    $this->postJson('/api/v1/auth/register', [
        'company_name' => 'Empresa',
        'name' => 'Admin',
        'email' => 'admin@empresa.com',
        'password' => 'senha123',
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['password']);
});

it('token retornado é válido para autenticar', function (): void {
    $response = $this->postJson('/api/v1/auth/register', [
        'company_name' => 'Tech SA',
        'name' => 'Admin',
        'email' => 'admin@tech.com',
        'password' => 'senha123',
        'password_confirmation' => 'senha123',
    ])->assertCreated();

    $token = $response->json('result.token');
    $tenantId = $response->json('result.tenant_id');

    $this->getJson('/api/v1/auth/me', [
        'Authorization' => "Bearer {$token}",
        'X-Tenant-ID' => $tenantId,
    ])->assertOk()
        ->assertJsonPath('result.email', 'admin@tech.com');
});
