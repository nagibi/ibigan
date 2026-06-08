<?php

use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Central\TenantController;
use App\Http\Controllers\Api\V1\Tenant\ActivityLogController;
use App\Http\Controllers\Api\V1\Tenant\InviteController;
use App\Http\Controllers\Api\V1\Tenant\MessageTemplateController;
use App\Http\Controllers\Api\V1\Tenant\NotificationController;
use App\Http\Controllers\Api\V1\Tenant\OrganizationController;
use App\Http\Controllers\Api\V1\Tenant\ProfileController;
use App\Http\Controllers\Api\V1\Tenant\UserController;
use App\Http\Middleware\InitializeTenancyByHeader;
use Illuminate\Support\Facades\Route;

// Rotas públicas
Route::prefix('v1')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::post('login', [AuthController::class, 'login']);
        Route::post('register', [AuthController::class, 'register']);
        Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
        Route::post('reset-password', [AuthController::class, 'resetPassword']);
    });

    Route::post('invites/accept', [InviteController::class, 'accept'])
        ->middleware(InitializeTenancyByHeader::class);
});

// Rotas centrais — banco landlord, sem contexto de tenant
Route::prefix('central/v1')
    ->middleware(['auth:sanctum'])
    ->group(function () {
        Route::get('tenants', [TenantController::class, 'index']);
        Route::post('tenants/switch', [TenantController::class, 'switch']);
    });

// Rotas protegidas — requer X-Tenant-ID + token Sanctum
Route::prefix('v1')
    ->middleware([InitializeTenancyByHeader::class, 'auth:sanctum'])
    ->group(function () {
        Route::prefix('auth')->group(function () {
            Route::get('me', [AuthController::class, 'me']);
            Route::post('logout', [AuthController::class, 'logout']);
        });

        Route::prefix('profile')->group(function () {
            Route::get('/', [ProfileController::class, 'show']);
            Route::put('/', [ProfileController::class, 'update']);
            Route::put('password', [ProfileController::class, 'updatePassword']);
            Route::post('avatar', [ProfileController::class, 'uploadAvatar']);
            Route::delete('avatar', [ProfileController::class, 'deleteAvatar']);
        });

        Route::get('users/export', [UserController::class, 'export']);
        Route::apiResource('users', UserController::class);
        Route::post('users/{user}/avatar', [UserController::class, 'uploadAvatar']);
        Route::get('organizations/export', [OrganizationController::class, 'export']);
        Route::apiResource('organizations', OrganizationController::class);
        Route::post('organizations/{organization}/logo', [OrganizationController::class, 'uploadLogo']);

        Route::get('activity-logs', [ActivityLogController::class, 'index']);
        Route::get('activity-logs/{type}/{id}', [ActivityLogController::class, 'forSubject']);

        Route::post('message-templates/{messageTemplate}/send', [MessageTemplateController::class, 'send']);
        Route::apiResource('message-templates', MessageTemplateController::class);

        Route::apiResource('invites', InviteController::class)->only(['index', 'store', 'destroy']);

        Route::get('notifications', [NotificationController::class, 'index']);
        Route::patch('notifications/read-all', [NotificationController::class, 'markAllAsRead']);
        Route::patch('notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
        Route::delete('notifications/{notification}', [NotificationController::class, 'destroy']);
    });

// Rotas centrais — superusuário (sem InitializeTenancyByHeader)
Route::prefix('central/v1')
    ->middleware(['auth:sanctum'])
    ->group(function () {
        Route::get('tenants', [TenantController::class, 'index']);
        Route::post('tenants/switch', [TenantController::class, 'switch']);
    });
