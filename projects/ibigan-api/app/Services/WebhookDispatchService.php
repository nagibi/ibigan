<?php

declare(strict_types=1);

namespace App\Services;

use App\Jobs\DispatchWebhookJob;
use App\Models\Webhook;

final class WebhookDispatchService
{
    /**
     * @param  array<string, mixed>  $payload
     */
    public function dispatch(string $event, array $payload): void
    {
        Webhook::query()
            ->where('is_active', true)
            ->whereJsonContains('events', $event)
            ->each(fn (Webhook $webhook) => DispatchWebhookJob::dispatch(
                $webhook->id,
                $event,
                $payload,
            ));
    }
}
