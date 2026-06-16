<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant\Equipamento\Concerns;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

trait AppliesEquipamentoCatalogGrid
{
    protected function catalogSortDirection(Request $request): string
    {
        return $request->string('direction', 'asc')->toString() === 'desc' ? 'desc' : 'asc';
    }

    /**
     * @param  Builder<\Illuminate\Database\Eloquent\Model>  $query
     * @return Builder<\Illuminate\Database\Eloquent\Model>
     */
    protected function applyCatalogAuditDateFilters(Builder $query, Request $request): Builder
    {
        return $query
            ->when(
                $request->filled('filter_created_at_from'),
                fn (Builder $q) => $q->whereDate('created_at', '>=', $request->string('filter_created_at_from')->toString()),
            )
            ->when(
                $request->filled('filter_created_at_to'),
                fn (Builder $q) => $q->whereDate('created_at', '<=', $request->string('filter_created_at_to')->toString()),
            )
            ->when(
                $request->filled('filter_updated_at_from'),
                fn (Builder $q) => $q->whereDate('updated_at', '>=', $request->string('filter_updated_at_from')->toString()),
            )
            ->when(
                $request->filled('filter_updated_at_to'),
                fn (Builder $q) => $q->whereDate('updated_at', '<=', $request->string('filter_updated_at_to')->toString()),
            );
    }

    /**
     * @param  list<string>  $allowed
     * @param  Builder<\Illuminate\Database\Eloquent\Model>  $query
     * @return Builder<\Illuminate\Database\Eloquent\Model>
     */
    protected function applyCatalogSort(
        Builder $query,
        Request $request,
        array $allowed,
        string $defaultColumn,
        ?callable $custom = null,
    ): Builder {
        $sort = $request->filled('sort') ? $request->string('sort')->toString() : null;
        $direction = $this->catalogSortDirection($request);

        if ($sort && $custom !== null) {
            $customResult = $custom($query, $sort, $direction);
            if ($customResult !== null) {
                return $customResult;
            }
        }

        if ($sort && in_array($sort, $allowed, true)) {
            return $query->orderBy($sort, $direction);
        }

        return $query->orderBy($defaultColumn);
    }
}
