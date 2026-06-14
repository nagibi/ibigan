<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Tenant;
use App\Services\CampaignService;
use Illuminate\Console\Command;

final class DispatchScheduledCampaignsCommand extends Command
{
    protected $signature = 'campaigns:dispatch-scheduled';

    protected $description = 'Dispara campanhas agendadas cujo horário já passou';

    public function handle(CampaignService $campaignService): int
    {
        $dispatched = 0;

        foreach (Tenant::query()->cursor() as $tenant) {
            tenancy()->initialize($tenant);

            try {
                $dispatched += $campaignService->dispatchDueScheduledCampaigns();
            } finally {
                tenancy()->end();
            }
        }

        if ($dispatched > 0) {
            $this->info("Disparadas {$dispatched} campanha(s) agendada(s).");
        }

        return self::SUCCESS;
    }
}
