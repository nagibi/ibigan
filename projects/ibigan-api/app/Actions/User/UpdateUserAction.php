<?php

declare(strict_types=1);

namespace App\Actions\User;

use App\Http\Requests\User\UpdateUserRequest;
use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Support\UserRoleAssignment;

final class UpdateUserAction
{
    public function __construct(
        private readonly UserRepositoryInterface $userRepository,
    ) {}

    public function execute(User $user, UpdateUserRequest $request): User
    {
        $validated = $request->validated();
        unset($validated['roles'], $validated['role']);

        $updatedUser = $this->userRepository->update($user, [
            ...$validated,
            'updated_by' => $request->user()->id,
        ]);

        if ($request->has('roles') || $request->has('role')) {
            UserRoleAssignment::sync($updatedUser, UserRoleAssignment::assignableFromRequest($request));
        }

        return $updatedUser->load(['roles', 'creator', 'updater']);
    }
}
