<?php

declare(strict_types=1);

use App\Models\Tenant;
use App\Models\User;
use App\Notifications\UserCreatedNotification;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $tenantId = 'tenant-'.uniqid();

    /** @var TestCase&object{tenant: Tenant, admin: User, viewer: User} $this */
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

// --- Index ---

it('retorna lista paginada de notificações', function (): void {
    $this->tenant->run(function (): void {
        $this->admin->notify(new UserCreatedNotification($this->admin));
        $this->admin->notify(new UserCreatedNotification($this->admin));
    });

    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $this->getJson('/api/v1/notifications', ['X-Tenant-ID' => $this->tenant->id])
        ->assertOk()
        ->assertJsonPath('status', 1)
        ->assertJsonStructure([
            'result' => [
                'data' => [['id', 'type', 'data', 'read_at', 'created_at']],
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
            ],
        ]);
});

it('retorna lista vazia quando não há notificações', function (): void {
    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $this->getJson('/api/v1/notifications', ['X-Tenant-ID' => $this->tenant->id])
        ->assertOk()
        ->assertJsonPath('result.meta.total', 0);
});

// --- Mark as read ---

it('marca uma notificação como lida', function (): void {
    $notificationId = null;

    $this->tenant->run(function () use (&$notificationId): void {
        $this->admin->notify(new UserCreatedNotification($this->admin));
        $notificationId = $this->admin->notifications()->first()->id;
    });

    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $this->patchJson("/api/v1/notifications/{$notificationId}/read", [], ['X-Tenant-ID' => $this->tenant->id])
        ->assertOk()
        ->assertJsonPath('status', 1)
        ->assertJsonPath('result.read_at', fn ($v) => $v !== null);
});

it('retorna 404 ao marcar notificação inexistente como lida', function (): void {
    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $this->patchJson('/api/v1/notifications/'.Str::uuid().'/read', [], ['X-Tenant-ID' => $this->tenant->id])
        ->assertNotFound();
});

// --- Mark as unread ---

it('marca uma notificação como não lida', function (): void {
    $notificationId = null;

    $this->tenant->run(function () use (&$notificationId): void {
        $this->admin->notify(new UserCreatedNotification($this->admin));
        $notificationId = $this->admin->notifications()->first()->id;
        $this->admin->notifications()->first()->markAsRead();
    });

    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $this->patchJson("/api/v1/notifications/{$notificationId}/unread", [], ['X-Tenant-ID' => $this->tenant->id])
        ->assertOk()
        ->assertJsonPath('status', 1)
        ->assertJsonPath('result.read_at', null);

    $this->tenant->run(function (): void {
        expect($this->admin->unreadNotifications()->count())->toBe(1);
    });
});

it('retorna contagem de não lidas no meta da listagem', function (): void {
    $this->tenant->run(function (): void {
        $this->admin->notify(new UserCreatedNotification($this->admin));
        $this->admin->notify(new UserCreatedNotification($this->admin));
        $this->admin->notifications()->first()->markAsRead();
    });

    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $this->getJson('/api/v1/notifications', ['X-Tenant-ID' => $this->tenant->id])
        ->assertOk()
        ->assertJsonPath('result.meta.unread', 1);
});

// --- Mark all as read ---

it('marca todas as notificações como lidas', function (): void {
    $this->tenant->run(function (): void {
        $this->admin->notify(new UserCreatedNotification($this->admin));
        $this->admin->notify(new UserCreatedNotification($this->admin));
    });

    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $this->patchJson('/api/v1/notifications/read-all', [], ['X-Tenant-ID' => $this->tenant->id])
        ->assertOk()
        ->assertJsonPath('status', 1);

    $this->tenant->run(function (): void {
        expect($this->admin->unreadNotifications()->count())->toBe(0);
    });
});

// --- Destroy ---

it('deleta uma notificação', function (): void {
    $notificationId = null;

    $this->tenant->run(function () use (&$notificationId): void {
        $this->admin->notify(new UserCreatedNotification($this->admin));
        $notificationId = $this->admin->notifications()->first()->id;
    });

    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $this->deleteJson("/api/v1/notifications/{$notificationId}", [], ['X-Tenant-ID' => $this->tenant->id])
        ->assertOk()
        ->assertJsonPath('status', 1);

    $this->tenant->run(function (): void {
        expect($this->admin->notifications()->count())->toBe(0);
    });
});

// --- Filtros ---

it('filtra notificações por status de leitura', function (): void {
    $this->tenant->run(function (): void {
        $this->admin->notify(new UserCreatedNotification($this->admin));
        $this->admin->notify(new UserCreatedNotification($this->admin));
        $this->admin->notifications()->first()->markAsRead();
    });

    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $this->getJson('/api/v1/notifications?filter_read_status=unread', ['X-Tenant-ID' => $this->tenant->id])
        ->assertOk()
        ->assertJsonPath('result.meta.total', 1);

    $this->getJson('/api/v1/notifications?filter_read_status=read', ['X-Tenant-ID' => $this->tenant->id])
        ->assertOk()
        ->assertJsonPath('result.meta.total', 1);
});

it('filtra notificações por id e título', function (): void {
    $notificationId = null;

    $this->tenant->run(function () use (&$notificationId): void {
        $this->admin->notify(new UserCreatedNotification($this->admin));
        $notificationId = $this->admin->notifications()->first()->id;
    });

    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $this->getJson("/api/v1/notifications?filter_id={$notificationId}", ['X-Tenant-ID' => $this->tenant->id])
        ->assertOk()
        ->assertJsonPath('result.meta.total', 1)
        ->assertJsonPath('result.data.0.id', $notificationId);

    $this->getJson('/api/v1/notifications?filter_title='.$this->admin->name, ['X-Tenant-ID' => $this->tenant->id])
        ->assertOk()
        ->assertJsonPath('result.meta.total', 1);
});

// --- Disparo automático ---

it('dispara notificação ao criar usuário', function (): void {
    Sanctum::actingAs($this->admin, ['*'], 'sanctum');

    $this->postJson('/api/v1/users', [
        'name' => 'Novo Usuário',
        'email' => 'novo@test.com',
        'password' => 'senha123',
        'password_confirmation' => 'senha123',
        'role' => 'viewer',
    ], ['X-Tenant-ID' => $this->tenant->id])->assertCreated();

    $this->tenant->run(function (): void {
        expect($this->admin->notifications()->count())->toBeGreaterThan(0);
    });
});

