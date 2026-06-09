<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class UserNotificationPreference extends Model
{
    protected $fillable = ['user_id', 'event', 'channel', 'enabled'];

    protected $casts = ['enabled' => 'boolean'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
