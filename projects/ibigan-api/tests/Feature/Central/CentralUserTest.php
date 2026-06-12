<?php

declare(strict_types=1);

use App\Models\Central\CentralUser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->superUser = CentralUser::create([
        'name' => 'Super Admin',
        'email' => 'super@ibigan.com',
        'password' => 'senha123',
        'is_super_admin' => true,
        'is_active' => true,
    ]);

    $this->otherSuper = CentralUser::create([
        'name' => 'Outro Super',
        'email' => 'super2@ibigan.com',
        'password' => 'senha123',
        'is_super_admin' => true,
        'is_active' => true,
    ]);

    $this->commonUser = CentralUser::create([
        'name' => 'Comum',
        'email' => 'comum@ibigan.com',
        'password' => 'senha123',
        'is_super_admin' => false,
        'is_active' => true,
    ]);
});

it('lista central-users para super-admin', function (): void {
    Sanctum::actingAs($this->superUser, ['*'], 'central');

    $this->getJson('/api/central/v1/admin/central-users')
        ->assertOk()
        ->assertJsonPath('status', 1)
        ->assertJsonStructure(['result' => ['data' => [['id', 'name', 'email', 'is_super_admin', 'is_active']]]]);
});

it('nega listagem para usuário comum', function (): void {
    Sanctum::actingAs($this->commonUser, ['*'], 'central');

    $this->getJson('/api/central/v1/admin/central-users')->assertForbidden();
});

it('nega listagem sem autenticação', function (): void {
    $this->getJson('/api/central/v1/admin/central-users')->assertUnauthorized();
});

it('promove usuário comum a super-admin', function (): void {
    Sanctum::actingAs($this->superUser, ['*'], 'central');

    $this->patchJson("/api/central/v1/admin/central-users/{$this->commonUser->id}/toggle-super-admin")
        ->assertOk()
        ->assertJsonPath('result.is_super_admin', true);

    expect($this->commonUser->fresh()->is_super_admin)->toBeTrue();
});

it('rebaixa outro super-admin', function (): void {
    Sanctum::actingAs($this->superUser, ['*'], 'central');

    $this->patchJson("/api/central/v1/admin/central-users/{$this->otherSuper->id}/toggle-super-admin")
        ->assertOk()
        ->assertJsonPath('result.is_super_admin', false);
});

it('impede rebaixar a si mesmo', function (): void {
    Sanctum::actingAs($this->superUser, ['*'], 'central');

    $this->patchJson("/api/central/v1/admin/central-users/{$this->superUser->id}/toggle-super-admin")
        ->assertUnprocessable();

    expect($this->superUser->fresh()->is_super_admin)->toBeTrue();
});

it('mantém pelo menos um super-admin no sistema', function (): void {
    Sanctum::actingAs($this->superUser, ['*'], 'central');

    $this->patchJson("/api/central/v1/admin/central-users/{$this->otherSuper->id}/toggle-super-admin")
        ->assertOk()
        ->assertJsonPath('result.is_super_admin', false);

    $this->patchJson("/api/central/v1/admin/central-users/{$this->superUser->id}/toggle-super-admin")
        ->assertUnprocessable();

    expect(CentralUser::where('is_super_admin', true)->count())->toBeGreaterThanOrEqual(1);
});
