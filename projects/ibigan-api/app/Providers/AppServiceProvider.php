<?php

declare(strict_types=1);

namespace App\Providers;

use App\Repositories\Contracts\ActivityLogRepositoryInterface;
use App\Repositories\Contracts\CentralUserRepositoryInterface;
use App\Repositories\Contracts\InviteRepositoryInterface;
use App\Repositories\Contracts\MessageTemplateRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Repositories\Eloquent\EloquentActivityLogRepository;
use App\Repositories\Eloquent\EloquentCentralUserRepository;
use App\Repositories\Eloquent\EloquentInviteRepository;
use App\Repositories\Eloquent\EloquentMessageTemplateRepository;
use App\Models\MultiTenantPersonalAccessToken;
use App\Repositories\Eloquent\EloquentUserRepository;
use App\Models\Central\CentralUser;
use App\Support\DevToolsAccess;
use App\Support\SentryContext;
use App\Support\TimezoneResolver;
use Dedoc\Scramble\Scramble;
use Dedoc\Scramble\Support\Generator\OpenApi;
use Illuminate\Queue\Events\JobProcessing;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Laravel\Sanctum\Sanctum;
use SocialiteProviders\Apple\Provider as AppleProvider;
use SocialiteProviders\Manager\SocialiteWasCalled;
use Stancl\Tenancy\Events\TenancyEnded;
use Stancl\Tenancy\Events\TenancyInitialized;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(CentralUserRepositoryInterface::class, EloquentCentralUserRepository::class);
        $this->app->bind(InviteRepositoryInterface::class, EloquentInviteRepository::class);
        $this->app->bind(MessageTemplateRepositoryInterface::class, EloquentMessageTemplateRepository::class);
        $this->app->bind(ActivityLogRepositoryInterface::class, EloquentActivityLogRepository::class);
        $this->app->bind(UserRepositoryInterface::class, EloquentUserRepository::class);

        Scramble::ignoreDefaultRoutes();
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        TimezoneResolver::applyDefault();

        Sanctum::usePersonalAccessTokenModel(MultiTenantPersonalAccessToken::class);

        Scramble::registerUiRoute('docs/api');
        Scramble::registerJsonSpecificationRoute('docs/api.json');

        Scramble::extendOpenApi(function (OpenApi $openApi): void {
            $openApi->info->title = config('scramble.ui.title', 'Ibigan API');
            $openApi->info->version = config('scramble.info.version', '1.0.0');
            $openApi->info->description = config('scramble.info.description', '');
        });

        Gate::define('viewApiDocs', function ($user = null) {
            if (DevToolsAccess::userCanAccess($user)) {
                return true;
            }

            if (DevToolsAccess::userCanAccess(Auth::guard('web')->user())) {
                return true;
            }

            $centralUserId = session('dev_tools_central_user_id');

            if (! is_numeric($centralUserId)) {
                return false;
            }

            return DevToolsAccess::userCanAccess(
                CentralUser::query()->find((int) $centralUserId),
            );
        });

        Event::listen(TenancyInitialized::class, function (TenancyInitialized $event): void {
            $timezone = $event->tenancy->tenant->timezone ?? null;

            if (is_string($timezone) && $timezone !== '') {
                TimezoneResolver::apply($timezone);
            }
        });

        Event::listen(TenancyEnded::class, function (): void {
            TimezoneResolver::applyDefault();
        });

        Event::listen(JobProcessing::class, function (): void {
            SentryContext::applyForQueue();
        });

        Event::listen(function (SocialiteWasCalled $event): void {
            $event->extendSocialite('apple', AppleProvider::class);
        });
    }
}
