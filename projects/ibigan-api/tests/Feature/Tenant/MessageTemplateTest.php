<?php

declare(strict_types=1);

use App\Models\MessageTemplate;
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

function templateHeaders(string $tenantId): array
{
    return ['X-Tenant-ID' => $tenantId];
}

function templatePayload(array $overrides = []): array
{
    return array_merge([
        'name' => 'Boas-vindas',
        'slug' => 'boas-vindas',
        'subject' => 'Bem-vindo ao {{empresa}}!',
        'channel' => 'email',
        'body' => 'Olá {{nome}}, seja bem-vindo!',
        'merge_tags' => ['{{nome}}', '{{empresa}}'],
        'is_active' => true,
    ], $overrides);
}

// --- Index ---

it('retorna lista paginada de templates para quem tem permissão de visualizar', function (): void {
    $this->tenant->run(function (): void {
        MessageTemplate::factory()->count(3)->create();
    });

    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $this->getJson('/api/v1/message-templates', templateHeaders($this->tenant->id))
        ->assertOk()
        ->assertJsonPath('status', 1)
        ->assertJsonStructure([
            'result' => [
                'data' => [['id', 'name', 'slug', 'subject', 'channel', 'body', 'merge_tags', 'is_active', 'created_at']],
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
            ],
        ]);
});

it('nega listagem para usuário sem autenticação', function (): void {
    $this->getJson('/api/v1/message-templates', templateHeaders($this->tenant->id))
        ->assertUnauthorized();
});

// --- Show ---

it('retorna um template específico', function (): void {
    $template = $this->tenant->run(fn () => MessageTemplate::factory()->create());

    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $this->getJson("/api/v1/message-templates/{$template->id}", templateHeaders($this->tenant->id))
        ->assertOk()
        ->assertJsonPath('status', 1)
        ->assertJsonPath('result.slug', $template->slug);
});

it('retorna 404 para template inexistente', function (): void {
    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $this->getJson('/api/v1/message-templates/999', templateHeaders($this->tenant->id))
        ->assertNotFound();
});

// --- Store ---

it('cria um template para quem tem permissão de gerenciar', function (): void {
    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $this->postJson('/api/v1/message-templates', templatePayload(), templateHeaders($this->tenant->id))
        ->assertCreated()
        ->assertJsonPath('status', 1)
        ->assertJsonPath('result.slug', 'boas-vindas')
        ->assertJsonPath('result.channel', 'email');
});

it('nega criação para viewer', function (): void {
    Sanctum::actingAs($this->viewer, ['*'], 'sanctum');

    $this->postJson('/api/v1/message-templates', templatePayload(), templateHeaders($this->tenant->id))
        ->assertForbidden();
});

it('nega criação com slug duplicado', function (): void {
    $this->tenant->run(fn () => MessageTemplate::factory()->create(['slug' => 'boas-vindas']));

    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $this->postJson('/api/v1/message-templates', templatePayload(), templateHeaders($this->tenant->id))
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['slug']);
});

it('nega criação com canal inválido', function (): void {
    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $this->postJson('/api/v1/message-templates', templatePayload(['channel' => 'fax']), templateHeaders($this->tenant->id))
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['channel']);
});

it('cria template com canal whatsapp', function (): void {
    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $this->postJson('/api/v1/message-templates', templatePayload([
        'slug' => 'whatsapp-boas-vindas',
        'channel' => 'whatsapp',
    ]), templateHeaders($this->tenant->id))
        ->assertCreated()
        ->assertJsonPath('result.channel', 'whatsapp');
});

// --- Update ---

it('atualiza um template para quem tem permissão de gerenciar', function (): void {
    $template = $this->tenant->run(fn () => MessageTemplate::factory()->create());

    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $this->putJson("/api/v1/message-templates/{$template->id}", templatePayload([
        'slug' => $template->slug,
        'subject' => 'Assunto Atualizado',
    ]), templateHeaders($this->tenant->id))
        ->assertOk()
        ->assertJsonPath('result.subject', 'Assunto Atualizado');
});

it('nega atualização para viewer', function (): void {
    $template = $this->tenant->run(fn () => MessageTemplate::factory()->create());

    Sanctum::actingAs($this->viewer, ['*'], 'sanctum');

    $this->putJson("/api/v1/message-templates/{$template->id}", templatePayload([
        'slug' => $template->slug,
    ]), templateHeaders($this->tenant->id))
        ->assertForbidden();
});

// --- Destroy ---

it('remove um template para quem tem permissão de gerenciar', function (): void {
    $template = $this->tenant->run(fn () => MessageTemplate::factory()->create());

    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $this->deleteJson("/api/v1/message-templates/{$template->id}", [], templateHeaders($this->tenant->id))
        ->assertOk()
        ->assertJsonPath('status', 1);
});

it('nega remoção para viewer', function (): void {
    $template = $this->tenant->run(fn () => MessageTemplate::factory()->create());

    Sanctum::actingAs($this->viewer, ['*'], 'sanctum');

    $this->deleteJson("/api/v1/message-templates/{$template->id}", [], templateHeaders($this->tenant->id))
        ->assertForbidden();
});
