<?php

declare(strict_types=1);

namespace App\Repositories\Eloquent;

use App\Models\Organization;
use App\Repositories\Contracts\OrganizationRepositoryInterface;
use Illuminate\Database\Eloquent\Builder;

final class EloquentOrganizationRepository extends BaseRepository implements OrganizationRepositoryInterface
{
    private const SORTABLE_COLUMNS = [
        'id',
        'name',
        'slug',
        'cnpj',
        'status',
        'created_at',
    ];

    public function __construct()
    {
        parent::__construct(new Organization);
    }

    public function findBySlug(string $slug): ?Organization
    {
        return $this->model->newQuery()
            ->where('slug', $slug)
            ->first();
    }

    public function paginate(int $perPage = 15, array $filters = []): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $query = $this->applyFilters($this->model->newQuery(), $filters);

        $sort = $filters['sort'] ?? null;
        $direction = ($filters['direction'] ?? 'asc') === 'desc' ? 'desc' : 'asc';

        if (is_string($sort) && in_array($sort, self::SORTABLE_COLUMNS, true)) {
            $query->orderBy($sort, $direction);
        } else {
            $query->latest();
        }

        return $query->paginate($perPage);
    }

    protected function applyFilters(Builder $query, array $filters): Builder
    {
        return $query
            ->when(
                filled($filters['search'] ?? null),
                fn (Builder $q) => $q->where(function (Builder $q) use ($filters): void {
                    $q->where('name', 'like', "%{$filters['search']}%")
                        ->orWhere('slug', 'like', "%{$filters['search']}%")
                        ->orWhere('cnpj', 'like', '%'.preg_replace('/\D+/', '', (string) $filters['search']).'%');
                })
            )
            ->when(
                filled($filters['status'] ?? null),
                fn (Builder $q) => $q->where('status', $filters['status'])
            )
            ->when(
                filled($filters['filter_id'] ?? null),
                function (Builder $q) use ($filters): void {
                    $ids = array_values(array_filter(array_map(
                        'trim',
                        explode(',', (string) $filters['filter_id'])
                    )));

                    if ($ids !== []) {
                        $q->whereIn('id', $ids);
                    }
                }
            )
            ->when(
                filled($filters['filter_name'] ?? null),
                fn (Builder $q) => $q->where('name', 'like', "%{$filters['filter_name']}%")
            )
            ->when(
                filled($filters['filter_slug'] ?? null),
                fn (Builder $q) => $q->where('slug', 'like', "%{$filters['filter_slug']}%")
            )
            ->when(
                filled($filters['filter_cnpj'] ?? null),
                fn (Builder $q) => $q->where(
                    'cnpj',
                    'like',
                    '%'.preg_replace('/\D+/', '', (string) $filters['filter_cnpj']).'%'
                )
            )
            ->when(
                filled($filters['filter_status'] ?? null),
                fn (Builder $q) => $q->where('status', $filters['filter_status'])
            )
            ->when(
                filled($filters['filter_created_at_from'] ?? null) || filled($filters['filter_created_at_to'] ?? null),
                function (Builder $q) use ($filters): void {
                    if (filled($filters['filter_created_at_from'] ?? null)) {
                        $q->whereDate('created_at', '>=', $filters['filter_created_at_from']);
                    }
                    if (filled($filters['filter_created_at_to'] ?? null)) {
                        $q->whereDate('created_at', '<=', $filters['filter_created_at_to']);
                    }
                }
            );
    }
}
