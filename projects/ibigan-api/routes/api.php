<?php

use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Auth\GoogleAuthController;
use App\Http\Controllers\Api\V1\Auth\TwoFactorChallengeController;
use App\Http\Controllers\Api\V1\Central\TenantController;
use App\Http\Controllers\Api\V1\Central\TenantSettingsController;
use App\Http\Controllers\Api\V1\Tenant\ActivityLogController;
use App\Http\Controllers\Api\V1\Tenant\CampaignController;
use App\Http\Controllers\Api\V1\Tenant\InviteController;
use App\Http\Controllers\Api\V1\Tenant\MenuController;
use App\Http\Controllers\Api\V1\Tenant\MessageTemplateController;
use App\Http\Controllers\Api\V1\Tenant\NotificationController;
use App\Http\Controllers\Api\V1\Tenant\OrganizationController;
use App\Http\Controllers\Api\V1\Tenant\ProfileController;
use App\Http\Controllers\Api\V1\Tenant\TwoFactorController;
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

// Rotas centrais — banco landlord, sem contexto de tenant
Route::prefix('central/v1')
    ->middleware(['auth:sanctum', 'throttle:api'])
    ->group(function () {
        Route::get('tenants', [TenantController::class, 'index']);
        Route::post('tenants/switch', [TenantController::class, 'switch']);
    });

// Rotas protegidas — requer X-Tenant-ID + token Sanctum
Route::prefix('v1')
    ->middleware([InitializeTenancyByHeader::class, 'auth:sanctum', 'throttle:api'])
    ->group(function () {
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
        Route::apiResource('users', UserController::class);
        Route::post('users/{user}/avatar', [UserController::class, 'uploadAvatar']);
        Route::get('organizations/export', [OrganizationController::class, 'export']);
        Route::apiResource('organizations', OrganizationController::class);
        Route::post('organizations/{organization}/logo', [OrganizationController::class, 'uploadLogo']);

        Route::get('activity-logs', [ActivityLogController::class, 'index']);
        Route::get('activity-logs/{type}/{id}', [ActivityLogController::class, 'forSubject']);

        Route::patch('menus/reorder', [MenuController::class, 'reorder']);
        Route::apiResource('menus', MenuController::class);

        Route::post('message-templates/{messageTemplate}/send', [MessageTemplateController::class, 'send']);
        Route::post('message-templates/{messageTemplate}/duplicate', [MessageTemplateController::class, 'duplicate']);
        Route::apiResource('message-templates', MessageTemplateController::class);

        Route::patch('campaigns/{campaign}/cancel', [CampaignController::class, 'cancel']);
        Route::get('campaigns/{campaign}/deliveries', [CampaignController::class, 'deliveries']);
        Route::apiResource('campaigns', CampaignController::class);

        Route::apiResource('invites', InviteController::class)->only(['index', 'store', 'destroy']);

        Route::get('notifications', [NotificationController::class, 'index']);
        Route::patch('notifications/read-all', [NotificationController::class, 'markAllAsRead']);
        Route::patch('notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
        Route::delete('notifications/{notification}', [NotificationController::class, 'destroy']);

        Route::get('webhooks/{webhook}/deliveries', [WebhookController::class, 'deliveries']);
        Route::apiResource('webhooks', WebhookController::class);
    });

// Rotas centrais — superusuário (sem InitializeTenancyByHeader)
Route::prefix('central/v1')
    ->middleware(['auth:sanctum', 'throttle:api'])
    ->group(function () {
        Route::get('tenants', [TenantController::class, 'index']);
        Route::post('tenants/switch', [TenantController::class, 'switch']);
    });
