<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\CampaignRecipientType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CampaignRecipient extends Model
{
    use HasFactory;

    protected $fillable = [
        'campaign_id',
        'type',
        'value',
    ];

    protected function casts(): array
    {
        return [
            'type' => CampaignRecipientType::class,
        ];
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }
}
