<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant\Equipamento\Concerns;

use App\Support\ApiResponse;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\JsonResponse;

trait RespondsWithPagination
{
    /**
     * @param  callable(mixed): array<string, mixed>  $mapper
     */
    protected function paginated(LengthAwarePaginator $paginator, callable $mapper, string $messageCode = 'MSG000067'): JsonResponse
    {
        return ApiResponse::success([
            'data' => collect($paginator->items())->map($mapper)->values()->all(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ], $messageCode);
    }
}
