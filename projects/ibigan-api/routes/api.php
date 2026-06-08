<?php

use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Middleware\InitializeTenancyByHeader;
use Illuminate\Support\Facades\Route;

// Rotas públicas
Route::prefix('v1')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::post('login', [AuthController::class, 'login']);
    });
});

// Rotas protegidas — requer X-Tenant-ID + token Sanctum
Route::prefix('v1')
    ->middleware([InitializeTenancyByHeader::class, 'auth:sanctum'])
    ->group(function () {
        Route::prefix('auth')->group(function () {
            Route::get('me',      [AuthController::class, 'me']);
            Route::post('logout', [AuthController::class, 'logout']);
        });
    });
