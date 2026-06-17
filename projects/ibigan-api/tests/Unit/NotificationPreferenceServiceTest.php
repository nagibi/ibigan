<?php

declare(strict_types=1);

use App\Models\Tenant;
use App\Models\User;
use App\Models\UserNotificationPreference;
use App\Services\NotificationPreferenceService;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * @property Tenant $tenant
 * @property User $user
 * @property NotificationPreferenceService $service
 */
uses(RefreshDatabase::class);

beforeEach(function (): void {
    $tenantId = 'notif-prefs-'.uniqid();

    /** @var TestCase&object{tenant: Tenant, user: User, service: NotificationPreferenceService} $this */
    $this->tenant = Tenant::create([
        'id' => $tenantId,
        'slug' => $tenantId,
        'name' => 'Notification Prefs Tenant',
    ]);

    $this->tenant->run(function (): void {
        $this->seed(RolePermissionSeeder::class);
    });

    $this->user = $this->tenant->run(function (): User {
        $user = User::factory()->create();
        $user->assignRole('admin');

        return $user;
    });

    $this->service = app(NotificationPreferenceService::class);
});

afterEach(function (): void {
    /** @var TestCase&object{tenant: Tenant} $this */
    cleanupTenantDatabaseFiles($this->tenant->id);
});

it('retorna defaults de app e e-mail quando não há preferências salvas', function (): void {
    $this->tenant->run(function (): void {
        $prefs = $this->service->getForUser($this->user);

        expect($prefs['report.completed']['app'])->toBeTrue()
            ->and($prefs['report.completed']['email'])->toBeTrue()
            ->and($prefs['campaign.sent']['app'])->toBeTrue()
            ->and($prefs['campaign.sent']['email'])->toBeFalse()
            ->and($prefs['user.created']['app'])->toBeTrue()
            ->and($prefs['user.created']['email'])->toBeFalse();
    });
});

it('persiste e retorna override de app', function (): void {
    $this->tenant->run(function (): void {
        $this->service->update($this->user, 'report.completed', 'app', false);

        $prefs = $this->service->getForUser($this->user);

        expect($prefs['report.completed']['app'])->toBeFalse()
            ->and($prefs['report.completed']['email'])->toBeTrue();

        expect(UserNotificationPreference::query()
            ->where('user_id', $this->user->id)
            ->where('event', 'report.completed')
            ->where('channel', 'app')
            ->value('enabled'))->toBeFalse();
    });
});

it('persiste e retorna override de e-mail', function (): void {
    $this->tenant->run(function (): void {
        $this->service->update($this->user, 'campaign.sent', 'email', true);

        $prefs = $this->service->getForUser($this->user);

        expect($prefs['campaign.sent']['email'])->toBeTrue()
            ->and($prefs['campaign.sent']['app'])->toBeTrue();
    });
});

it('isEnabled usa default do catálogo quando não há registro salvo', function (): void {
    $this->tenant->run(function (): void {
        expect($this->service->isEnabled($this->user, 'invite.accepted', 'email'))->toBeTrue()
            ->and($this->service->isEnabled($this->user, 'campaign.sent', 'email'))->toBeFalse()
            ->and($this->service->isEnabled($this->user, 'campaign.sent', 'app'))->toBeTrue();
    });
});

it('isEnabled respeita preferência salva do usuário', function (): void {
    $this->tenant->run(function (): void {
        $this->service->update($this->user, 'report.completed', 'email', false);

        expect($this->service->isEnabled($this->user, 'report.completed', 'email'))->toBeFalse()
            ->and($this->service->isEnabled($this->user, 'report.completed', 'app'))->toBeTrue();
    });
});

it('mantém preferências isoladas por usuário', function (): void {
    $this->tenant->run(function (): void {
        $otherUser = User::factory()->create();
        $otherUser->assignRole('viewer');

        $this->service->update($this->user, 'user.created', 'app', false);

        expect($this->service->isEnabled($this->user, 'user.created', 'app'))->toBeFalse()
            ->and($this->service->isEnabled($otherUser, 'user.created', 'app'))->toBeTrue();
    });
});
