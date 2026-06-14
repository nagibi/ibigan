<?php

declare(strict_types=1);

use App\Models\Central\CentralUser;
use App\Models\Central\PlatformMessageTemplate;
use App\Models\MessageTemplate;
use App\Models\Tenant;
use App\Services\PlatformCatalogService;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use App\Support\MessageTemplateSlugs;
use Database\Seeders\PlatformCatalogSeeder;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->seed(PlatformCatalogSeeder::class);

    $this->superAdmin = CentralUser::create([
        'name' => 'Super Admin',
        'email' => 'super-catalog@ibigan.com',
        'password' => 'senha123',
        'is_super_admin' => true,
        'is_active' => true,
    ]);

    Sanctum::actingAs($this->superAdmin, ['*'], 'central');
});

it('lista templates de mensagem do catálogo central', function (): void {
    $response = $this->getJson('/api/central/v1/admin/platform/message-templates')
        ->assertOk();

    expect($response->json('result.meta.total'))->toBeGreaterThan(0);
    expect(collect($response->json('result.data'))->pluck('slug'))
        ->toContain(MessageTemplateSlugs::USER_INVITE);
});

it('atualiza template de mensagem central via api', function (): void {
    $template = PlatformMessageTemplate::query()
        ->where('slug', MessageTemplateSlugs::USER_INVITE)
        ->firstOrFail();

    $this->putJson("/api/central/v1/admin/platform/message-templates/{$template->id}", [
        'subject' => 'Convite atualizado pela central',
    ])
        ->assertOk()
        ->assertJsonPath('result.subject', 'Convite atualizado pela central');

    expect(
        PlatformMessageTemplate::query()
            ->where('slug', MessageTemplateSlugs::USER_INVITE)
            ->value('subject')
    )->toBe('Convite atualizado pela central');
});

it('sincroniza template central atualizado para tenants', function (): void {
    $tenantId = 'catalog-sync-'.uniqid();
    $tenant = Tenant::create([
        'id' => $tenantId,
        'slug' => $tenantId,
        'name' => 'Catalog Sync Corp',
    ]);

    $tenant->run(function (): void {
        (new RolePermissionSeeder)->run();
    });

    PlatformMessageTemplate::query()
        ->where('slug', MessageTemplateSlugs::USER_INVITE)
        ->update(['subject' => 'Convite propagado pela central']);

    app(PlatformCatalogService::class)->syncAllTenants(force: true);

    $tenant->run(function (): void {
        expect(
            MessageTemplate::query()
                ->where('slug', MessageTemplateSlugs::USER_INVITE)
                ->value('subject')
        )->toBe('Convite propagado pela central');
    });

    cleanupTenantDatabaseFiles($tenantId);
});

it('duplica template de mensagem central', function (): void {
    $template = PlatformMessageTemplate::query()
        ->where('slug', MessageTemplateSlugs::USER_INVITE)
        ->firstOrFail();

    $this->postJson("/api/central/v1/admin/platform/message-templates/{$template->id}/duplicate")
        ->assertCreated()
        ->assertJsonPath('result.name', $template->name.' (cópia)');

    expect(
        PlatformMessageTemplate::query()
            ->where('slug', 'like', MessageTemplateSlugs::USER_INVITE.'-copia%')
            ->exists()
    )->toBeTrue();
});

it('envia teste de template de plataforma para o super-admin', function (): void {
    Mail::fake();

    $template = PlatformMessageTemplate::query()
        ->where('slug', MessageTemplateSlugs::USER_INVITE)
        ->firstOrFail();

    $this->postJson("/api/central/v1/admin/platform/message-templates/{$template->id}/test-send", [
        'merge_data' => [
            'invited_by' => 'Admin Central',
            'role' => 'admin',
            'link' => 'https://example.com/convite',
            'token' => 'abc123',
            'expires_at' => '31/12/2026',
        ],
    ])
        ->assertOk()
        ->assertJsonPath('result.recipient', 'super-catalog@ibigan.com');

    Mail::assertSent(\App\Mail\TemplateMailable::class, function (\App\Mail\TemplateMailable $mail): bool {
        $rendered = $mail->render();

        return str_contains($rendered, 'Admin Central')
            && str_contains($rendered, 'abc123');
    });
});

it('dispara campanha central para empresas selecionadas', function (): void {
    Queue::fake();

    $tenantId = 'platform-campaign-'.uniqid();
    $tenant = Tenant::create([
        'id' => $tenantId,
        'slug' => $tenantId,
        'name' => 'Platform Campaign Corp',
    ]);

    $tenant->run(function (): void {
        (new RolePermissionSeeder)->run();

        $user = \App\Models\User::factory()->create();
        $user->assignRole('admin');
    });

    app(PlatformCatalogService::class)->syncAllTenants(force: true);

    $this->postJson('/api/central/v1/admin/platform/campaigns', [
        'tenant_ids' => [$tenantId],
        'name' => 'Campanha central',
        'template_slug' => MessageTemplateSlugs::USER_INVITE,
        'channels' => ['email'],
        'recipients' => [
            ['type' => 'all'],
        ],
    ])
        ->assertCreated()
        ->assertJsonPath('result.dispatched.0.tenant_id', $tenantId);

    Queue::assertPushed(\App\Jobs\ProcessCampaignJob::class);

    cleanupTenantDatabaseFiles($tenantId);
});
