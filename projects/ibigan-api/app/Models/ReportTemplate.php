<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

final class ReportTemplate extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'name',
        'platform_key',
        'description',
        'query',
        'parameters',
        'columns',
        'is_active',
        'is_system',
        'created_by',
    ];

    protected $casts = [
        'parameters' => 'array',
        'columns'    => 'array',
        'is_active'  => 'boolean',
        'is_system'  => 'boolean',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function executions(): HasMany
    {
        return $this->hasMany(ReportExecution::class);
    }
}
