<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Events\OrganizationsExportCompleted;
use App\Exports\OrganizationsExport;
use App\Jobs\Concerns\TenantAwareJob;
use Illuminate\Contracts\Queue\ShouldQueue;

final class ExportOrganizationsJob implements ShouldQueue
{
    use TenantAwareJob;

    public function __construct(
        private readonly int $userId,
    ) {}

    public function handle(): void
    {
        $tenantId = tenant()->getTenantKey();
        $filename = sprintf('exports/organizations_%s_%s.xlsx', $tenantId, now()->timestamp);

        $userId = $this->userId;

        (new OrganizationsExport)
            ->queue($filename)
            ->chain([
                function () use ($userId, $filename): void {
                    event(new OrganizationsExportCompleted($userId, $filename));
                },
            ]);
    }
}
