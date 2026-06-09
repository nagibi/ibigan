<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Jobs\Concerns\TenantAwareJob;
use App\Models\Campaign;
use App\Services\CampaignService;
use Illuminate\Contracts\Queue\ShouldQueue;

final class ProcessCampaignJob implements ShouldQueue
{
    use TenantAwareJob;

    public function __construct(
        private readonly int $campaignId,
    ) {}

    public function handle(CampaignService $campaignService): void
    {
        $campaign = Campaign::query()->findOrFail($this->campaignId);

        $campaignService->process($campaign);
    }
}
