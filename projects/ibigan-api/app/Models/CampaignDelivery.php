<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\DeliveryChannel;
use App\Enums\DeliveryStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CampaignDelivery extends Model
{
    use HasFactory;

    protected $fillable = [
        'campaign_id',
        'user_id',
        'channel',
        'status',
        'recipient_email',
        'error_message',
        'metadata',
        'queued_at',
        'sent_at',
        'opened_at',
        'clicked_at',
    ];

    protected function casts(): array
    {
        return [
            'channel' => DeliveryChannel::class,
            'status' => DeliveryStatus::class,
            'metadata' => 'array',
            'queued_at' => 'datetime',
            'sent_at' => 'datetime',
            'opened_at' => 'datetime',
            'clicked_at' => 'datetime',
        ];
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
