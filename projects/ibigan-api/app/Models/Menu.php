<?php

declare(strict_types=1);

namespace App\Models;

use App\Search\TenantSearchable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

class Menu extends Model
{
    use HasFactory;
    use LogsActivity;
    use SoftDeletes;
    use TenantSearchable;

    protected $fillable = [
        'title',
        'translation_key',
        'slug',
        'icon',
        'badge',
        'path',
        'target',
        'parent_id',
        'order',
        'is_active',
        'requires_auth',
        'roles',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'requires_auth' => 'boolean',
            'roles' => 'array',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logAll();
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id')->orderBy('order');
    }

    protected function defaultSearchableAs(): string
    {
        return 'menus';
    }

    /**
     * @return array<string, mixed>
     */
    public function toSearchableArray(): array
    {
        return [
            'id' => (string) $this->id,
            'type' => 'menu',
            'title' => $this->title,
            'path' => $this->path,
            'slug' => $this->slug,
            'roles' => $this->roles ?? [],
        ];
    }

    public function shouldBeSearchable(): bool
    {
        return (bool) $this->is_active;
    }
}
