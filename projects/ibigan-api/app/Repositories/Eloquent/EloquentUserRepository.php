<?php

declare(strict_types=1);

namespace App\Repositories\Eloquent;

use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Database\Eloquent\Builder;

final class EloquentUserRepository extends BaseRepository implements UserRepositoryInterface
{
    public function __construct()
    {
        parent::__construct(new User);
    }

    public function findByEmail(string $email): ?User
    {
        return $this->model->newQuery()
            ->where('email', $email)
            ->first();
    }

    protected function applyFilters(Builder $query, array $filters): Builder
    {
        return $query
            ->with(['roles'])
            ->when(
                isset($filters['search']),
                fn (Builder $q) => $q->where(function (Builder $q) use ($filters): void {
                    $q->where('name', 'like', "%{$filters['search']}%")
                        ->orWhere('email', 'like', "%{$filters['search']}%");
                })
            )
            ->when(
                isset($filters['status']),
                fn (Builder $q) => $q->where('status', $filters['status'])
            );
    }
}
