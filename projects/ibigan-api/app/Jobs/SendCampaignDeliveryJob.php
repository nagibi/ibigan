<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Jobs\Concerns\TenantAwareJob;
use App\Models\CampaignDelivery;
use App\Services\CampaignService;
use Illuminate\Contracts\Queue\ShouldQueue;

final class SendCampaignDeliveryJob implements ShouldQueue
{
    use TenantAwareJob;

    public function __construct(
        private readonly int $deliveryId,
    ) {}

    public function handle(CampaignService $campaignService): void
    {
        $delivery = CampaignDelivery::query()->findOrFail($this->deliveryId);

        $campaignService->sendDelivery($delivery);
    }
}
