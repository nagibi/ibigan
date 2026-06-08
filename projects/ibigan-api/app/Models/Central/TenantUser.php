<?php

declare(strict_types=1);

namespace App\Models\Central;

use App\Models\Tenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Stancl\Tenancy\Database\Concerns\CentralConnection;

final class TenantUser extends Model
{
    use CentralConnection;

    protected $fillable = [
        'tenant_id',
        'user_id',
        'role',
        'is_default',
        'joined_at',
    ];

    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
            'joined_at' => 'datetime',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
