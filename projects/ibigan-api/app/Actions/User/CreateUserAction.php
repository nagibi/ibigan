<?php

declare(strict_types=1);

namespace App\Actions\User;

use App\Http\Requests\User\StoreUserRequest;
use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;

final class CreateUserAction
{
    public function __construct(
        private readonly UserRepositoryInterface $userRepository,
    ) {}

    public function execute(StoreUserRequest $request): User
    {
        $user = $this->userRepository->create([
            'name' => $request->validated('name'),
            'email' => $request->validated('email'),
            'password' => $request->validated('password'),
        ]);

        $user->assignRole($request->input('role', 'viewer'));

        return $user->load('roles');
    }
}
