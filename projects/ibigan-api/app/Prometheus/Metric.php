<?php

declare(strict_types=1);

namespace App\Prometheus;

use Ninebit\LaravelPrometheus\Contracts\MetricDefinition;

enum Metric: string implements MetricDefinition
{
    case TENANTS_TOTAL = 'tenants_total';

    public function helpText(): string
    {
        return match ($this) {
            self::TENANTS_TOTAL => 'Total number of tenants on the platform',
        };
    }

    public function labelNames(): array
    {
        return match ($this) {
            self::TENANTS_TOTAL => [],
        };
    }

    public function buckets(): ?array
    {
        return null;
    }
}
