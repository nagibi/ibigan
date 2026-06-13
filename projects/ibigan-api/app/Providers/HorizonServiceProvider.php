<?php

namespace App\Providers;

use App\Models\Central\CentralUser;
use App\Support\DevToolsAccess;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Laravel\Horizon\Horizon;
use Laravel\Horizon\HorizonApplicationServiceProvider;

class HorizonServiceProvider extends HorizonApplicationServiceProvider
{
    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        parent::boot();

        // Horizon::routeSmsNotificationsTo('15556667777');
        // Horizon::routeMailNotificationsTo('example@example.com');
        // Horizon::routeSlackNotificationsTo('slack-webhook-url', '#channel');
    }

    /**
     * Register the Horizon gate.
     *
     * This gate determines who can access Horizon in non-local environments.
     */
    protected function gate(): void
    {
        Gate::define('viewHorizon', function ($user = null) {
            if (DevToolsAccess::userCanAccess($user)) {
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
    }

    protected function authorization(): void
    {
        $this->gate();

        Horizon::auth(function ($request) {
            if (app()->environment('local')) {
                return true;
            }

            if (Gate::check('viewHorizon', [Auth::guard('web')->user()])) {
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
    }
}
