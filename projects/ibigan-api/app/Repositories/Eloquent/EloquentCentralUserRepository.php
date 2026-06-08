<?php

declare(strict_types=1);

namespace App\Repositories\Eloquent;

use App\Models\Central\TenantUser;
use App\Repositories\Contracts\CentralUserRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

final class EloquentCentralUserRepository implements CentralUserRepositoryInterface
{
    public function tenantsForUser(int $userId): Collection
    {
        return TenantUser::query()
            ->with('tenant')
            ->where('user_id', $userId)
            ->get();
    }
}
