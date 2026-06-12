<?php

declare(strict_types=1);

use App\Jobs\ProcessReportJob;
use App\Models\ReportTemplate;
use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $tenantId = 'tenant-'.uniqid();
    $this->tenant = Tenant::create(['id' => $tenantId, 'slug' => $tenantId, 'name' => 'Test']);
    $this->tenant->run(fn () => $this->seed(RolePermissionSeeder::class));

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

function reportHeaders(string $tenantId): array
{
    return ['X-Tenant-ID' => $tenantId];
}

it('lista relatórios para usuário com permissão', function (): void {
    $this->tenant->run(fn () => ReportTemplate::factory()->count(3)->create(['created_by' => $this->admin->id]));

    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $this->getJson('/api/v1/reports', reportHeaders($this->tenant->id))
        ->assertOk()
        ->assertJsonPath('status', 1)
        ->assertJsonStructure(['result' => ['data', 'meta']]);
});

it('admin cria template de relatório', function (): void {
    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $this->postJson('/api/v1/reports', [
        'name' => 'Usuários',
        'query' => 'SELECT id, name FROM users',
        'parameters' => [],
        'columns' => [['key' => 'id', 'label' => 'ID', 'format' => 'number']],
        'is_active' => true,
    ], reportHeaders($this->tenant->id))
        ->assertCreated()
        ->assertJsonPath('result.name', 'Usuários');
});

it('nega criação para viewer', function (): void {
    Sanctum::actingAs($this->viewer, ['*'], 'sanctum');

    $this->postJson('/api/v1/reports', [
        'name' => 'Teste',
        'query' => 'SELECT 1',
    ], reportHeaders($this->tenant->id))
        ->assertForbidden();
});

it('executa relatório com parâmetros', function (): void {
    Queue::fake();

    $template = $this->tenant->run(fn () => ReportTemplate::factory()->create([
        'created_by' => $this->admin->id,
        'query' => 'SELECT id, name FROM users LIMIT 5',
        'parameters' => [],
        'is_active' => true,
    ]));

    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $this->postJson("/api/v1/reports/{$template->id}/execute", [
        'parameters' => [],
    ], reportHeaders($this->tenant->id))
        ->assertOk()
        ->assertJsonPath('status', 1)
        ->assertJsonPath('result.status', 'queued')
        ->assertJsonStructure(['result' => ['execution_id', 'status', 'progress_message']]);

    Queue::assertPushed(ProcessReportJob::class);
});

it('rejeita query com INSERT', function (): void {
    $template = $this->tenant->run(fn () => ReportTemplate::factory()->create([
        'created_by' => $this->admin->id,
        'query' => 'INSERT INTO users (name) VALUES ("hack")',
        'is_active' => true,
    ]));

    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $this->postJson("/api/v1/reports/{$template->id}/execute", [
        'parameters' => [],
    ], reportHeaders($this->tenant->id))
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['query']);
});

it('rejeita query que não começa com SELECT', function (): void {
    $template = $this->tenant->run(fn () => ReportTemplate::factory()->create([
        'created_by' => $this->admin->id,
        'query' => 'DROP TABLE users',
        'is_active' => true,
    ]));

    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $this->postJson("/api/v1/reports/{$template->id}/execute", [
        'parameters' => [],
    ], reportHeaders($this->tenant->id))
        ->assertUnprocessable();
});

it('registra execução no histórico', function (): void {
    Queue::fake();

    $template = $this->tenant->run(fn () => ReportTemplate::factory()->create([
        'created_by' => $this->admin->id,
        'query' => 'SELECT id FROM users LIMIT 1',
        'is_active' => true,
    ]));

    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $this->postJson("/api/v1/reports/{$template->id}/execute", [
        'parameters' => [],
    ], reportHeaders($this->tenant->id))->assertOk();

    $this->getJson("/api/v1/reports/{$template->id}/executions", reportHeaders($this->tenant->id))
        ->assertOk()
        ->assertJsonPath('result.meta.total', 1)
        ->assertJsonPath('result.data.0.status', 'queued');
});

it('admin atualiza template', function (): void {
    $template = $this->tenant->run(fn () => ReportTemplate::factory()->create(['created_by' => $this->admin->id]));

    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $this->putJson("/api/v1/reports/{$template->id}", [
        'name' => 'Nome Atualizado',
    ], reportHeaders($this->tenant->id))
        ->assertOk()
        ->assertJsonPath('result.name', 'Nome Atualizado');
});

it('admin remove template', function (): void {
    $template = $this->tenant->run(fn () => ReportTemplate::factory()->create(['created_by' => $this->admin->id]));

    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $this->deleteJson("/api/v1/reports/{$template->id}", [], reportHeaders($this->tenant->id))
        ->assertOk();
});

it('ativa registro', function (): void {
    $template = $this->tenant->run(fn () => ReportTemplate::factory()->create([
        'created_by' => $this->admin->id,
        'is_active' => false,
    ]));

    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $this->patchJson("/api/v1/reports/{$template->id}/toggle-active", [
        'is_active' => true,
    ], reportHeaders($this->tenant->id))
        ->assertOk()
        ->assertJsonPath('result.is_active', true);
});

it('inativa registro', function (): void {
    $template = $this->tenant->run(fn () => ReportTemplate::factory()->create([
        'created_by' => $this->admin->id,
        'is_active' => true,
    ]));

    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $this->patchJson("/api/v1/reports/{$template->id}/toggle-active", [
        'is_active' => false,
    ], reportHeaders($this->tenant->id))
        ->assertOk()
        ->assertJsonPath('result.is_active', false);
});

it('nega toggle para viewer', function (): void {
    $template = $this->tenant->run(fn () => ReportTemplate::factory()->create(['created_by' => $this->admin->id]));

    Sanctum::actingAs($this->viewer, ['*'], 'sanctum');

    $this->patchJson("/api/v1/reports/{$template->id}/toggle-active", [
        'is_active' => false,
    ], reportHeaders($this->tenant->id))
        ->assertForbidden();
});

it('permite baixar resultado salvo mesmo com status failed', function (): void {
    $template = $this->tenant->run(fn () => ReportTemplate::factory()->create([
        'created_by' => $this->admin->id,
        'is_active' => true,
    ]));

    $execution = $this->tenant->run(function () use ($template) {
        $path = 'reports/failed-with-result.json';
        \Illuminate\Support\Facades\Storage::disk('local')->put(
            $path,
            json_encode([['mes' => '2026-01', 'total' => 1]], JSON_THROW_ON_ERROR),
        );

        return \App\Models\ReportExecution::query()->create([
            'report_template_id' => $template->id,
            'executed_by' => $this->admin->id,
            'parameters' => [],
            'status' => 'failed',
            'error_message' => 'Falha ao enviar e-mail.',
            'result_path' => $path,
            'result_rows_count' => 1,
            'result_expires_at' => now()->addDays(7),
            'executed_at' => now(),
        ]);
    });

    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $this->getJson(
        "/api/v1/reports/{$template->id}/executions/{$execution->id}/result?page=1&per_page=10000",
        reportHeaders($this->tenant->id),
    )
        ->assertOk()
        ->assertJsonPath('status', 1)
        ->assertJsonPath('result.data.0.total', 1);
});
