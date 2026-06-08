<?php

declare(strict_types=1);

use App\Models\Organization;
use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Activitylog\Models\Activity;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    config(['activitylog.enabled' => true]);

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

    $this->unauthorizedUser = $this->tenant->run(function (): User {
        return User::factory()->create();
    });
});

afterEach(function (): void {
    tenancy()->end();

    $databasePath = database_path('ibigan_tenant_'.$this->tenant->id);

    if (file_exists($databasePath)) {
        unlink($databasePath);
    }
});

function activityLogHeaders(string $tenantId): array
{
    return ['X-Tenant-ID' => $tenantId];
}

it('retorna lista paginada de logs de atividade', function (): void {
    $this->tenant->run(function (): void {
        $user = User::factory()->create();
        activity()->performedOn($user)->log('teste de log');
    });

    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $response = $this->getJson('/api/v1/activity-logs', activityLogHeaders($this->tenant->id))
        ->assertOk()
        ->assertJsonStructure([
            'status',
            'message',
            'result' => [
                'data' => [
                    ['id', 'log_name', 'description', 'subject_type', 'subject_id', 'causer_type', 'causer_id', 'causer_name', 'properties', 'created_at'],
                ],
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
            ],
        ])
        ->assertJsonPath('status', 1);

    expect($response->json('result.meta.total'))->toBeGreaterThanOrEqual(1);
});

it('retorna logs de um recurso específico', function (): void {
    $targetUser = $this->tenant->run(function (): User {
        $user = User::factory()->create();
        activity()->performedOn($user)->log('log do usuário');

        return $user;
    });

    $this->tenant->run(function (): void {
        activity()->performedOn(Organization::factory()->create())->log('log de outra entidade');
    });

    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $response = $this->getJson("/api/v1/activity-logs/users/{$targetUser->id}", activityLogHeaders($this->tenant->id))
        ->assertOk()
        ->assertJsonPath('status', 1);

    expect($response->json('result.meta.total'))->toBeGreaterThanOrEqual(1);

    collect($response->json('result.data'))
        ->each(fn (array $log) => expect($log['subject_id'])->toBe($targetUser->id));
});

it('registra log ao criar usuário', function (): void {
    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $this->postJson('/api/v1/users', [
        'name' => 'Logged User',
        'email' => 'logged@example.com',
        'password' => 'Password1',
        'password_confirmation' => 'Password1',
        'role' => 'viewer',
    ], activityLogHeaders($this->tenant->id))
        ->assertCreated();

    $this->tenant->run(function (): void {
        $activity = Activity::query()
            ->where('subject_type', User::class)
            ->where('event', 'created')
            ->where('description', 'created')
            ->where('attribute_changes->attributes->email', 'logged@example.com')
            ->first();

        expect($activity)->not->toBeNull()
            ->and($activity->causer_id)->toBe($this->admin->id);
    });
});

it('registra log ao atualizar organização', function (): void {
    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $organization = $this->tenant->run(fn () => Organization::factory()->create(['name' => 'Org Original']));

    $this->tenant->run(function () use ($organization): void {
        $organization->update(['name' => 'Org Atualizada']);
    });

    $this->tenant->run(function () use ($organization): void {
        $activity = Activity::query()
            ->where('subject_type', Organization::class)
            ->where('subject_id', $organization->id)
            ->where('event', 'updated')
            ->first();

        expect($activity)->not->toBeNull()
            ->and($activity->attribute_changes?->get('attributes')['name'])->toBe('Org Atualizada');
    });
});

it('nega acesso para usuário sem permissão', function (): void {
    Sanctum::actingAs($this->unauthorizedUser, ['*'], 'sanctum');

    $this->getJson('/api/v1/activity-logs', activityLogHeaders($this->tenant->id))
        ->assertForbidden();
});
