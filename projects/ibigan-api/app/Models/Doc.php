<?php

declare(strict_types=1);

namespace App\Models;

use App\Search\TenantSearchable;
use Illuminate\Database\Eloquent\Model;

class Doc extends Model
{
    use TenantSearchable;

    protected $fillable = [
        'title',
        'slug',
        'body',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    protected function defaultSearchableAs(): string
    {
        return 'docs';
    }

    /**
     * @return array<string, mixed>
     */
    public function toSearchableArray(): array
    {
        return [
            'id' => (string) $this->id,
            'type' => 'doc',
            'title' => $this->title,
            'excerpt' => str((string) $this->body)->stripTags()->limit(160)->toString(),
            'path' => "/docs/{$this->slug}",
            'searchable_by' => 'doc-visualizar',
        ];
    }

    public function shouldBeSearchable(): bool
    {
        return (bool) $this->is_active;
    }
}
