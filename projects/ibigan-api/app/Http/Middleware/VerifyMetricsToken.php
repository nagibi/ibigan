<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class VerifyMetricsToken
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! config('prometheus.enabled')) {
            abort(404);
        }

        $token = config('prometheus.endpoint.token');

        if ($token === null || $token === '') {
            abort(503, 'Metrics token not configured');
        }

        $provided = $request->bearerToken() ?? $request->header('X-Metrics-Token');

        if (! is_string($provided) || ! hash_equals($token, $provided)) {
            abort(403);
        }

        return $next($request);
    }
}
