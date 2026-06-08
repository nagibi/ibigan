<?php

declare(strict_types=1);

namespace App\Repositories\Eloquent;

use App\Models\Organization;
use App\Models\User;
use App\Repositories\Contracts\ActivityLogRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use InvalidArgumentException;
use Spatie\Activitylog\Models\Activity;

final class EloquentActivityLogRepository implements ActivityLogRepositoryInterface
{
    public function forSubject(string $type, int $id, int $perPage = 15): LengthAwarePaginator
    {
        $subjectType = $this->resolveSubjectType($type);

        return Activity::query()
            ->with(['causer'])
            ->where('subject_type', $subjectType)
            ->where('subject_id', $id)
            ->latest()
            ->paginate($perPage);
    }

    public function forCauser(int $userId, int $perPage = 15): LengthAwarePaginator
    {
        return Activity::query()
            ->with(['causer'])
            ->where('causer_type', (new User)->getMorphClass())
            ->where('causer_id', $userId)
            ->latest()
            ->paginate($perPage);
    }

    public function paginate(int $perPage = 15, array $filters = []): LengthAwarePaginator
    {
        return $this->applyFilters(Activity::query()->with(['causer']), $filters)
            ->latest()
            ->paginate($perPage);
    }

    private function applyFilters(Builder $query, array $filters): Builder
    {
        return $query
            ->when(
                isset($filters['log_name']),
                fn (Builder $q) => $q->where('log_name', $filters['log_name'])
            )
            ->when(
                isset($filters['subject_type']),
                fn (Builder $q) => $q->where('subject_type', $this->resolveSubjectType($filters['subject_type']))
            )
            ->when(
                isset($filters['causer_id']),
                fn (Builder $q) => $q->where('causer_id', $filters['causer_id'])
            )
            ->when(
                isset($filters['date_from']),
                fn (Builder $q) => $q->whereDate('created_at', '>=', $filters['date_from'])
            )
            ->when(
                isset($filters['date_to']),
                fn (Builder $q) => $q->whereDate('created_at', '<=', $filters['date_to'])
            );
    }

    private function resolveSubjectType(string $type): string
    {
        return match ($type) {
            'users', 'user' => User::class,
            'organizations', 'organization' => Organization::class,
            default => class_exists($type) ? $type : throw new InvalidArgumentException("Tipo de subject inválido: {$type}"),
        };
    }
}
