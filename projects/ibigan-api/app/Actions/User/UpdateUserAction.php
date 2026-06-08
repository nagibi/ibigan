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
        return $this->userRepository->update($user, $request->validated());
    }
}
