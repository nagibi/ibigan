<?php

declare(strict_types=1);

namespace App\Actions\User;

use App\Http\Requests\User\UpdateUserRequest;
use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;

final class UpdateUserAction
{
    public function __construct(
        private readonly UserRepositoryInterface $userRepository,
    ) {}

    public function execute(User $user, UpdateUserRequest $request): User
    {
        $updatedUser = $this->userRepository->update($user, [
            ...$request->validated(),
            'updated_by' => $request->user()->id,
        ]);

        return $updatedUser->load(['roles', 'creator', 'updater']);
    }
}
