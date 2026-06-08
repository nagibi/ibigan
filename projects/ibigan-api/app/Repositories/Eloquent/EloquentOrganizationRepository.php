<?php

declare(strict_types=1);

namespace App\Repositories\Eloquent;

use App\Models\Organization;
use App\Repositories\Contracts\OrganizationRepositoryInterface;
use Illuminate\Database\Eloquent\Builder;

final class EloquentOrganizationRepository extends BaseRepository implements OrganizationRepositoryInterface
{
    public function __construct()
    {
        parent::__construct(new Organization);
    }

    protected function applyFilters(Builder $query, array $filters): Builder
    {
        return $query
            ->when(
                isset($filters['search']),
                fn (Builder $q) => $q->where(function (Builder $q) use ($filters): void {
                    $q->where('name', 'like', "%{$filters['search']}%")
                        ->orWhere('slug', 'like', "%{$filters['search']}%");
                })
            )
            ->when(
                isset($filters['status']),
                fn (Builder $q) => $q->where('status', $filters['status'])
            );
    }
}
