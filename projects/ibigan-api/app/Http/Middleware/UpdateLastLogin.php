<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

final class UpdateLastLogin
{
    public function handle(Request $request, Closure $next): mixed
    {
        $response = $next($request);

        // Só atualiza se a rota for de login tenant (não central)
        if (
            $request->is('api/v1/auth/login') &&
            $request->user() &&
            tenant()
        ) {
            $request->user()->update([
                'last_login_at'     => now(),
                'last_login_ip'     => $request->ip(),
                'last_login_device' => $request->userAgent(),
            ]);
        }

        return $response;
    }
}
