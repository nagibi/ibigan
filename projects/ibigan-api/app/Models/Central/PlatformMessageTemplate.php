<?php

declare(strict_types=1);

namespace App\Models\Central;

use Illuminate\Database\Eloquent\Model;
use Stancl\Tenancy\Database\Concerns\CentralConnection;

final class PlatformMessageTemplate extends Model
{
    use CentralConnection;

    protected $fillable = [
        'slug',
        'name',
        'subject',
        'body',
        'merge_tags',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'merge_tags' => 'array',
            'is_active' => 'boolean',
        ];
    }
}
