<?php

declare(strict_types=1);

namespace App\Prometheus\Collectors;

use App\Models\Tenant;
use App\Prometheus\Metric;
use Ninebit\LaravelPrometheus\Contracts\CollectorInterface;
use Ninebit\LaravelPrometheus\Contracts\MetricsRegistryInterface;

final class TenantsTotalCollector implements CollectorInterface
{
    public function collect(MetricsRegistryInterface $registry): void
    {
        $registry->gauge(Metric::TENANTS_TOTAL)->set(Tenant::query()->count());
    }
}
