<?php

declare(strict_types=1);

namespace App\Jobs\Concerns;

use Illuminate\Bus\Queueable;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Jobs e exports que acessam dados do tenant devem usar este trait.
 * O QueueTenancyBootstrapper injeta tenant_id no payload quando
 * o job é despachado com tenancy inicializado.
 */
trait TenantAwareJob
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;
}
