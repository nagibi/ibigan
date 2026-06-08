<?php

declare(strict_types=1);

namespace App\Repositories\Contracts;

use App\Models\Central\TenantUser;
use Illuminate\Database\Eloquent\Collection;

interface CentralUserRepositoryInterface
{
    /**
     * @return Collection<int, TenantUser>
     */
    public function tenantsForUser(int $userId): Collection;
}
