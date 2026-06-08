<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Jobs\Concerns\TenantAwareJob;
use App\Models\Webhook;
use App\Models\WebhookDelivery;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Http;
use Throwable;

final class DispatchWebhookJob implements ShouldQueue
{
    use TenantAwareJob;

    public int $tries = 3;

    /**
     * @param  array<string, mixed>  $payload
     */
    public function __construct(
        private readonly int $webhookId,
        private readonly string $event,
        private readonly array $payload,
    ) {}

    public function handle(): void
    {
        $webhook = Webhook::query()->findOrFail($this->webhookId);

        $delivery = WebhookDelivery::query()->create([
            'webhook_id' => $webhook->id,
            'event' => $this->event,
            'payload' => $this->payload,
            'status' => 'pending',
            'attempts' => $this->attempts(),
        ]);

        $headers = ['X-Event' => $this->event];

        if ($webhook->secret) {
            $headers['X-Webhook-Secret'] = $webhook->secret;
        }

        try {
            $response = Http::timeout(30)
                ->withHeaders($headers)
                ->post($webhook->url, $this->payload);

            $delivery->update([
                'response_status' => $response->status(),
                'response_body' => $response->body(),
                'status' => $response->successful() ? 'success' : 'failed',
                'attempts' => $this->attempts(),
                'delivered_at' => $response->successful() ? now() : null,
            ]);

            if (! $response->successful()) {
                $this->fail('Webhook delivery failed with status '.$response->status());
            }
        } catch (Throwable $exception) {
            $delivery->update([
                'status' => 'failed',
                'attempts' => $this->attempts(),
            ]);

            throw $exception;
        }
    }
}
