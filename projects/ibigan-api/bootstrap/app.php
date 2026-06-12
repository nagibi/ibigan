<?php

use App\Http\Middleware\InitializeTenancyByHeader;
use App\Http\Middleware\SentryTenantContext;
use App\Http\Middleware\UpdateLastLogin;
use App\Http\Middleware\VerifyMetricsToken;
use App\Providers\RateLimitServiceProvider;
use App\Support\ApiResponse;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Sentry\Laravel\Integration;

return Application::configure(basePath: dirname(__DIR__))
    ->withProviders([
        RateLimitServiceProvider::class,
    ])
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        channels: __DIR__ . '/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        //$middleware->statefulApi();
        $middleware->append(UpdateLastLogin::class);

        // Tenancy deve rodar ANTES do Sanctum auth
        $middleware->prependToGroup('api', InitializeTenancyByHeader::class);

        // Contexto Sentry por tenant — após InitializeTenancyByHeader nas rotas que usam o grupo
        $middleware->appendToGroup('tenant', [
            SentryTenantContext::class,
        ]);

        $middleware->alias([
            'metrics.token' => VerifyMetricsToken::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        Integration::handles($exceptions);

        $exceptions->render(function (ValidationException $exception, Request $request) {
            if (! $request->expectsJson() && ! $request->is('api/*') && ! $request->is('central/*')) {
                return null;
            }

            $errors = collect($exception->errors())->flatMap(
                fn (array $messages, string $field): array => collect($messages)->map(
                    function (string $message) use ($field): array {
                        $messageCode = str_contains($message, 'required')
                            ? 'validation.required'
                            : (str_contains($message, 'email') ? 'validation.email' : 'validation.failed');

                        return [
                            'field' => $field,
                            'message' => $message,
                            'message_code' => $messageCode,
                        ];
                    },
                )->all(),
            )->values()->all();

            return ApiResponse::error(
                'validation.failed',
                errors: $errors,
                httpStatus: $exception->status,
            );
        });
    })->create();
