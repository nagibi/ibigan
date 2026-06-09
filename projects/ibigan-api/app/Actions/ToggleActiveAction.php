<?php

declare(strict_types=1);

namespace App\Actions;

use App\Enums\OrganizationStatus;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

final class ToggleActiveAction
{
    public function execute(Model $model, bool $isActive, ?int $updatedBy = null): Model
    {
        $model->forceFill(['is_active' => $isActive]);

        if ($model instanceof User) {
            $model->status = $isActive ? 'active' : 'inactive';

            if ($updatedBy !== null) {
                $model->updated_by = $updatedBy;
            }
        }

        if ($model instanceof Organization) {
            $model->status = $isActive
                ? OrganizationStatus::Active
                : OrganizationStatus::Inactive;
        }

        $model->save();

        return $model->fresh();
    }
}
