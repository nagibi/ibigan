<?php

declare(strict_types=1);

namespace App\Providers;

use App\Repositories\Contracts\ActivityLogRepositoryInterface;
use App\Repositories\Contracts\CentralUserRepositoryInterface;
use App\Repositories\Contracts\OrganizationRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Repositories\Eloquent\EloquentActivityLogRepository;
use App\Repositories\Eloquent\EloquentCentralUserRepository;
use App\Repositories\Eloquent\EloquentOrganizationRepository;
use App\Repositories\Eloquent\EloquentUserRepository;
use Dedoc\Scramble\Scramble;
use Dedoc\Scramble\Support\Generator\OpenApi;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(CentralUserRepositoryInterface::class, EloquentCentralUserRepository::class);
        $this->app->bind(OrganizationRepositoryInterface::class, EloquentOrganizationRepository::class);
        $this->app->bind(ActivityLogRepositoryInterface::class, EloquentActivityLogRepository::class);
        $this->app->bind(UserRepositoryInterface::class, EloquentUserRepository::class);

        Scramble::ignoreDefaultRoutes();
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Scramble::registerUiRoute('docs/api');
        Scramble::registerJsonSpecificationRoute('docs/api.json');

        Scramble::extendOpenApi(function (OpenApi $openApi): void {
            $openApi->info->title = 'Ibigan API';
            $openApi->info->version = '1.0.0';
        });
    }
}
