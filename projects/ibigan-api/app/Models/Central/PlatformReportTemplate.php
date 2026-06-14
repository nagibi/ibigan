<?php

declare(strict_types=1);

namespace App\Models\Central;

use Illuminate\Database\Eloquent\Model;
use Stancl\Tenancy\Database\Concerns\CentralConnection;

final class PlatformReportTemplate extends Model
{
    use CentralConnection;

    protected $fillable = [
        'platform_key',
        'name',
        'description',
        'query',
        'parameters',
        'columns',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'parameters' => 'array',
            'columns' => 'array',
            'is_active' => 'boolean',
        ];
    }
}
