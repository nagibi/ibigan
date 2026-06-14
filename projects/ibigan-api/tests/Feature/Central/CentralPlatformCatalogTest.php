<?php

declare(strict_types=1);

use App\Models\Central\CentralUser;
use App\Models\Central\PlatformMessageTemplate;
use App\Models\MessageTemplate;
use App\Models\Tenant;
use App\Services\PlatformCatalogService;
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
