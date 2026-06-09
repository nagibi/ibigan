<?php

declare(strict_types=1);

namespace App\Repositories\Eloquent;

use App\Models\MessageTemplate;
use App\Repositories\Contracts\MessageTemplateRepositoryInterface;
use Illuminate\Database\Eloquent\Builder;

final class EloquentMessageTemplateRepository extends BaseRepository implements MessageTemplateRepositoryInterface
{
    public function __construct()
    {
        parent::__construct(new MessageTemplate);
    }

    protected function applyFilters(Builder $query, array $filters): Builder
    {
        return $query
            ->when(
                isset($filters['search']),
                fn (Builder $q) => $q->where(function (Builder $q) use ($filters): void {
                    $q->where('name', 'like', "%{$filters['search']}%")
                        ->orWhere('slug', 'like', "%{$filters['search']}%")
                        ->orWhere('subject', 'like', "%{$filters['search']}%");
                })
            )
            ->when(
                isset($filters['is_active']),
                fn (Builder $q) => $q->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN))
            );
    }
}
