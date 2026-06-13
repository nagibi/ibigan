<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Support\Facades\Log;
use Throwable;

final class Broadcaster
{
    public static function safe(ShouldBroadcast $event): void
    {
        if (config('broadcasting.default') === 'null') {
            return;
        }

        try {
            broadcast($event);
        } catch (Throwable $exception) {
            Log::warning('Broadcast failed.', [
                'event' => $event::class,
                'message' => $exception->getMessage(),
            ]);
        }
    }
}
