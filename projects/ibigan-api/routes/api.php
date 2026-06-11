<?php

use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Auth\GoogleAuthController;
use App\Http\Controllers\Api\V1\Auth\TwoFactorChallengeController;
use App\Http\Controllers\Api\V1\Central\CentralAuthController;
use App\Http\Controllers\Api\V1\Central\CentralUserController;
use App\Http\Controllers\Api\V1\Central\TenantAdminController;
use App\Http\Controllers\Api\V1\Central\TenantController;
use App\Http\Controllers\Api\V1\Central\TenantSettingsController;
use App\Http\Controllers\Api\V1\Tenant\ActivityLogController;
use App\Http\Controllers\Api\V1\Tenant\CampaignController;
use App\Http\Controllers\Api\V1\Tenant\GlobalSearchController;
use App\Http\Controllers\Api\V1\Tenant\InviteController;
use App\Http\Controllers\Api\V1\Tenant\MenuController;
use App\Http\Controllers\Api\V1\Tenant\MessageTemplateController;
use App\Http\Controllers\Api\V1\Tenant\NotificationController;
use App\Http\Controllers\Api\V1\Tenant\NotificationPreferenceController;
use App\Http\Controllers\Api\V1\Tenant\PermissionController;
use App\Http\Controllers\Api\V1\Tenant\ProfileController;
use App\Http\Controllers\Api\V1\Tenant\RoleController;
use App\Http\Controllers\Api\V1\Tenant\ReportController;
use App\Http\Controllers\Api\V1\Tenant\TwoFactorController;
use App\Http\Controllers\Api\V1\Tenant\UserApprovalController;
use App\Http\Controllers\Api\V1\Tenant\UserController;
use App\Http\Controllers\Api\V1\Tenant\WebhookController;
use App\Http\Middleware\InitializeTenancyByHeader;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;

Broadcast::routes([
    'middleware' => [InitializeTenancyByHeader::class, 'auth:sanctum'],
]);


// Rotas públicas
Route::prefix('v1')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::get('google', [GoogleAuthController::class, 'redirect']);
        Route::get('google/callback', [GoogleAuthController::class, 'callback']);
        Route::post('login', [AuthController::class, 'login'])->middleware('throttle:login');
        Route::post('register', [AuthController::class, 'register'])->middleware('throttle:register');
        Route::post('forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:forgot-password');
        Route::post('reset-password', [AuthController::class, 'resetPassword']);
        Route::post('two-factor-challenge', [TwoFactorChallengeController::class, 'verify'])->middleware('throttle:two-factor');
    });

    Route::post('invites/accept', [InviteController::class, 'accept'])
        ->middleware([InitializeTenancyByHeader::class, 'throttle:invite-accept']);
});

// ─── Auth central (público) ───────────────────────────────────────────────
Route::prefix('central/v1/auth')
    ->middleware(['throttle:api'])
    ->group(function () {
        Route::post('login', [CentralAuthController::class, 'login']);
    });

// ─── Rotas centrais para usuários de TENANT (auth:sanctum) ───────────────
Route::prefix('central/v1')
    ->middleware([InitializeTenancyByHeader::class, 'auth:sanctum', 'tenant', 'throttle:api'])
    ->group(function () {
        Route::get('tenants', [TenantController::class, 'index']);
        Route::post('tenants/switch', [TenantController::class, 'switch']);
    });

// ─── Rotas centrais para SUPER-ADMIN (auth:central) ──────────────────────
Route::prefix('central/v1')
    ->middleware(['auth:central', 'throttle:api'])
    ->group(function () {
        Route::get('auth/me', [CentralAuthController::class, 'me']);
        Route::post('auth/logout', [CentralAuthController::class, 'logout']);

        Route::prefix('admin')->group(function () {
            Route::get('tenants', [TenantAdminController::class, 'index']);
            Route::post('tenants', [TenantAdminController::class, 'store']);
            Route::get('tenants/{tenant}', [TenantAdminController::class, 'show']);
            Route::put('tenants/{tenant}', [TenantAdminController::class, 'update']);
            Route::patch('tenants/{tenant}/toggle-active', [TenantAdminController::class, 'toggleActive']);
            Route::get('tenants/{tenant}/activity-logs', [TenantAdminController::class, 'activityLogs']);
            Route::post('tenants/{tenant}/impersonate', [TenantAdminController::class, 'impersonate']);
            Route::delete('tenants/{tenant}', [TenantAdminController::class, 'destroy']);

            Route::get('central-users', [CentralUserController::class, 'index']);
            Route::patch('central-users/{centralUser}/toggle-super-admin', [CentralUserController::class, 'toggleSuperAdmin']);
        });
    });

// Rotas protegidas — requer X-Tenant-ID + token Sanctum
Route::prefix('v1')
    ->middleware([InitializeTenancyByHeader::class, 'auth:sanctum', 'tenant', 'throttle:api'])
    ->group(function () {
        Route::get('search', GlobalSearchController::class)->name('search.global');

        Route::prefix('auth')->group(function () {
            Route::get('me', [AuthController::class, 'me']);
            Route::post('logout', [AuthController::class, 'logout']);
        });

        Route::prefix('two-factor')->group(function () {
            Route::post('enable', [TwoFactorController::class, 'enable']);
            Route::post('confirm', [TwoFactorController::class, 'confirm']);
            Route::post('disable', [TwoFactorController::class, 'disable']);
            Route::get('recovery-codes', [TwoFactorController::class, 'recoveryCodes']);
            Route::post('recovery-codes', [TwoFactorController::class, 'regenerateRecoveryCodes']);
        });

        Route::prefix('profile')->group(function () {
            Route::get('/', [ProfileController::class, 'show']);
            Route::put('/', [ProfileController::class, 'update']);
            Route::put('password', [ProfileController::class, 'updatePassword']);
            Route::post('avatar', [ProfileController::class, 'uploadAvatar']);
            Route::delete('avatar', [ProfileController::class, 'deleteAvatar']);
        });

        Route::get('tenant/settings', [TenantSettingsController::class, 'show']);
        Route::put('tenant/settings', [TenantSettingsController::class, 'update']);
        Route::post('tenant/settings/logo', [TenantSettingsController::class, 'uploadLogo']);
        Route::delete('tenant/settings/logo', [TenantSettingsController::class, 'deleteLogo']);

        Route::get('users/export', [UserController::class, 'export']);
        Route::patch('users/{user}/toggle-active', [UserController::class, 'toggleActive']);
        Route::apiResource('users', UserController::class);
        Route::post('users/{user}/avatar', [UserController::class, 'uploadAvatar']);

        Route::prefix('user-approvals')->group(function () {
            Route::get('/', [UserApprovalController::class, 'index']);
            Route::patch('{userApproval}/approve', [UserApprovalController::class, 'approve']);
            Route::patch('{userApproval}/reject', [UserApprovalController::class, 'reject']);
        });

        Route::get('activity-logs', [ActivityLogController::class, 'index']);
        Route::get('activity-logs/{type}/{id}', [ActivityLogController::class, 'forSubject']);

        Route::patch('menus/reorder', [MenuController::class, 'reorder']);
        Route::apiResource('menus', MenuController::class);

        Route::apiResource('permissions', PermissionController::class)->only([
            'index',
            'show',
            'store',
            'update',
            'destroy',
        ]);
        Route::put('roles/{role}/permissions', [RoleController::class, 'syncPermissions']);
        Route::apiResource('roles', RoleController::class);

        Route::post('message-templates/upload-image', [MessageTemplateController::class, 'uploadImage']);
        Route::post('message-templates/{messageTemplate}/send', [MessageTemplateController::class, 'send']);
        Route::post('message-templates/{messageTemplate}/duplicate', [MessageTemplateController::class, 'duplicate']);
        Route::patch('message-templates/{messageTemplate}/toggle-active', [MessageTemplateController::class, 'toggleActive']);
        Route::apiResource('message-templates', MessageTemplateController::class);

        Route::patch('campaigns/{campaign}/toggle-active', [CampaignController::class, 'toggleActive']);
        Route::patch('campaigns/{campaign}/cancel', [CampaignController::class, 'cancel']);
        Route::get('campaigns/{campaign}/deliveries', [CampaignController::class, 'deliveries']);
        Route::apiResource('campaigns', CampaignController::class);

        Route::apiResource('invites', InviteController::class)->only(['index', 'store', 'destroy']);

        Route::get('notifications', [NotificationController::class, 'index']);
        Route::patch('notifications/read-all', [NotificationController::class, 'markAllAsRead']);
        Route::patch('notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
        Route::patch('notifications/{notification}/unread', [NotificationController::class, 'markAsUnread']);
        Route::delete('notifications/{notification}', [NotificationController::class, 'destroy']);

        Route::get('notification-preferences', [NotificationPreferenceController::class, 'index']);
        Route::patch('notification-preferences', [NotificationPreferenceController::class, 'update']);

        Route::get('webhooks/{webhook}/deliveries', [WebhookController::class, 'deliveries']);
        Route::patch('webhooks/{webhook}/toggle-active', [WebhookController::class, 'toggleActive']);
        Route::apiResource('webhooks', WebhookController::class);

        Route::get('reports/executions/my', [ReportController::class, 'myExecutions']);
        Route::patch('reports/{report}/toggle-active', [ReportController::class, 'toggleActive']);
        Route::post('reports/{report}/execute', [ReportController::class, 'execute']);
        Route::get('reports/{report}/executions', [ReportController::class, 'executions']);
        Route::get('reports/{report}/executions/{execution}/result', [ReportController::class, 'result']);
        Route::get('reports/{report}/executions/{execution}/status', [ReportController::class, 'executionStatus']);
        Route::apiResource('reports', ReportController::class);
    });
