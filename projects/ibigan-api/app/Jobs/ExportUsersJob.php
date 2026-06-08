<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Events\UsersExportCompleted;
use App\Exports\UsersExport;
use App\Jobs\Concerns\TenantAwareJob;
use Illuminate\Contracts\Queue\ShouldQueue;

final class ExportUsersJob implements ShouldQueue
{
    use TenantAwareJob;

    public function __construct(
        private readonly int $userId,
    ) {}

    public function handle(): void
    {
        $tenantId = tenant()->getTenantKey();
        $filename = sprintf('exports/users_%s_%s.xlsx', $tenantId, now()->timestamp);

        $userId = $this->userId;

        (new UsersExport)
            ->queue($filename)
            ->chain([
                function () use ($userId, $filename): void {
                    event(new UsersExportCompleted($userId, $filename));
                },
            ]);
    }
}
