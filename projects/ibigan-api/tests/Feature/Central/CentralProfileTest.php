<?php

declare(strict_types=1);

use App\Models\Central\CentralUser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    Storage::fake('public');

    $this->user = CentralUser::create([
        'name' => 'Super Admin',
        'email' => 'super@ibigan.com',
        'password' => 'senha123',
        'is_super_admin' => true,
        'is_active' => true,
    ]);
});

it('retorna perfil central do usuário autenticado', function (): void {
    Sanctum::actingAs($this->user, ['*'], 'central');

    $this->getJson('/api/central/v1/profile')
        ->assertOk()
        ->assertJsonPath('status', 1)
        ->assertJsonPath('result.email', 'super@ibigan.com')
        ->assertJsonStructure([
            'result' => ['id', 'name', 'email', 'roles', 'avatar_url', 'created_at'],
        ]);
});

it('nega acesso ao perfil central sem autenticação', function (): void {
    $this->getJson('/api/central/v1/profile')
        ->assertUnauthorized();
});

it('atualiza dados do perfil central', function (): void {
    Sanctum::actingAs($this->user, ['*'], 'central');

    $this->putJson('/api/central/v1/profile', [
        'name' => 'Novo Nome',
        'email' => 'novo@ibigan.com',
        'cpf' => '52998224725',
        'phone' => '11999998888',
        'birth_date' => '1990-01-15',
        'gender' => 'male',
        'bio' => 'Bio de teste',
    ])
        ->assertOk()
        ->assertJsonPath('result.name', 'Novo Nome')
        ->assertJsonPath('result.email', 'novo@ibigan.com')
        ->assertJsonPath('result.cpf', '52998224725')
        ->assertJsonPath('result.bio', 'Bio de teste');
});

it('atualiza senha do perfil central com senha atual', function (): void {
    Sanctum::actingAs($this->user, ['*'], 'central');

    $this->putJson('/api/central/v1/profile/password', [
        'current_password' => 'senha123',
        'password' => 'novaSenha1',
        'password_confirmation' => 'novaSenha1',
    ])
        ->assertOk()
        ->assertJsonPath('status', 1);

    $this->user->refresh();
    expect(\Illuminate\Support\Facades\Hash::check('novaSenha1', $this->user->password))->toBeTrue();
});

it('faz upload de avatar no perfil central', function (): void {
    Sanctum::actingAs($this->user, ['*'], 'central');

    $file = UploadedFile::fake()->image('avatar.jpg');

    $this->postJson('/api/central/v1/profile/avatar', [
        'avatar' => $file,
    ])
        ->assertOk()
        ->assertJsonPath('status', 1)
        ->assertJsonStructure(['result' => ['avatar_url']]);

    expect($this->user->fresh()->getFirstMedia('avatar'))->not->toBeNull();
});

it('remove avatar do perfil central', function (): void {
    Sanctum::actingAs($this->user, ['*'], 'central');

    $file = UploadedFile::fake()->image('avatar.jpg');
    $this->user->addMedia($file)->toMediaCollection('avatar');

    $this->deleteJson('/api/central/v1/profile/avatar')
        ->assertOk()
        ->assertJsonPath('status', 1);

    expect($this->user->fresh()->getFirstMedia('avatar'))->toBeNull();
});

it('retorna status do 2FA central', function (): void {
    Sanctum::actingAs($this->user, ['*'], 'central');

    $this->getJson('/api/central/v1/two-factor/status')
        ->assertOk()
        ->assertJsonPath('result.enabled', false);
});

it('ativa 2FA totp no perfil central', function (): void {
    Sanctum::actingAs($this->user, ['*'], 'central');

    $this->postJson('/api/central/v1/two-factor/enable')
        ->assertOk()
        ->assertJsonPath('result.method', 'totp')
        ->assertJsonStructure(['result' => ['secret', 'qr_code_url', 'recovery_codes']]);
});
