<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Database\Eloquent\Builder;

final class GridFilter
{
    /**
     * @return list<string>
     */
    public static function csvValues(?string $value): array
    {
        if ($value === null || trim($value) === '') {
            return [];
        }

        return array_values(array_filter(array_map(
            static fn (string $item): string => trim($item),
            explode(',', $value),
        ), static fn (string $item): bool => $item !== ''));
    }

    /**
     * @param  Builder<\Illuminate\Database\Eloquent\Model>  $query
     * @return Builder<\Illuminate\Database\Eloquent\Model>
     */
    public static function applyWhereInFromCsv(Builder $query, string $column, ?string $value): Builder
    {
        $values = self::csvValues($value);

        if ($values === []) {
            return $query;
        }

        if (count($values) === 1) {
            return $query->where($column, $values[0]);
        }

        return $query->whereIn($column, $values);
    }
}
