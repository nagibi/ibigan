<?php

declare(strict_types=1);

namespace App\Repositories\Contracts;

use App\Models\Organization;

interface OrganizationRepositoryInterface extends BaseRepositoryInterface
{
    public function findBySlug(string $slug): ?Organization;
}
