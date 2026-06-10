<?php

declare(strict_types=1);

namespace App\Actions;

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

        $model->save();

        return $model->fresh();
    }
}
