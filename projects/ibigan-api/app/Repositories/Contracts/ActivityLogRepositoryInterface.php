<?php

declare(strict_types=1);

namespace App\Repositories\Contracts;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ActivityLogRepositoryInterface
{
    public function forSubject(string $type, int $id, int $perPage = 15): LengthAwarePaginator;

    public function forCauser(int $userId, int $perPage = 15): LengthAwarePaginator;

    public function paginate(int $perPage = 15, array $filters = []): LengthAwarePaginator;
}
