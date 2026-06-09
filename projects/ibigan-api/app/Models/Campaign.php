<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\CampaignStatus;
use App\Enums\CampaignType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Campaign extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'template_id',
        'subject',
        'body',
        'merge_data',
        'channels',
        'status',
        'type',
        'trigger',
        'scheduled_at',
        'started_at',
        'finished_at',
        'created_by',
        'stats',
    ];

    protected $attributes = [
        'status' => 'draft',
        'type' => 'manual',
    ];

    protected function casts(): array
    {
        return [
            'merge_data' => 'array',
            'channels' => 'array',
            'stats' => 'array',
            'status' => CampaignStatus::class,
            'type' => CampaignType::class,
            'scheduled_at' => 'datetime',
            'started_at' => 'datetime',
            'finished_at' => 'datetime',
        ];
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(MessageTemplate::class, 'template_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function recipients(): HasMany
    {
        return $this->hasMany(CampaignRecipient::class);
    }

    public function deliveries(): HasMany
    {
        return $this->hasMany(CampaignDelivery::class);
    }
}
