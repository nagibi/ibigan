<?php

declare(strict_types=1);

namespace App\Repositories\Eloquent;

use App\Models\Invite;
use App\Repositories\Contracts\InviteRepositoryInterface;
use App\Support\GridFilter;
use Illuminate\Database\Eloquent\Builder;

final class EloquentInviteRepository extends BaseRepository implements InviteRepositoryInterface
{
    public function __construct()
    {
        parent::__construct(new Invite);
    }

    protected function applyFilters(Builder $query, array $filters): Builder
    {
        return $query
            ->with(['invitedBy'])
            ->when(
                isset($filters['search']),
                fn (Builder $q) => $q->where('email', 'like', "%{$filters['search']}%")
            )
            ->when(
                isset($filters['status']),
                fn (Builder $q) => GridFilter::applyWhereInFromCsv($q, 'status', (string) $filters['status']),
            )
            ->when(
                isset($filters['role']),
                fn (Builder $q) => $q->where('role', $filters['role'])
            );
    }
}
