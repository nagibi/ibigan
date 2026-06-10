<?php

declare(strict_types=1);

namespace App\Actions\User;

use App\Http\Requests\User\StoreUserRequest;
use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Support\UserRoleAssignment;

final class CreateUserAction
{
    public function __construct(
        private readonly UserRepositoryInterface $userRepository,
    ) {}

    public function execute(StoreUserRequest $request): User
    {
        $actorId = $request->user()->id;

        $user = $this->userRepository->create([
            'name' => $request->validated('name'),
            'email' => $request->validated('email'),
            'cpf' => $request->validated('cpf'),
            'password' => $request->validated('password'),
            'phone' => $request->validated('phone'),
            'birth_date' => $request->validated('birth_date'),
            'gender' => $request->validated('gender'),
            'bio' => $request->validated('bio'),
            'created_by' => $actorId,
            'updated_by' => $actorId,
        ]);

        $roles = UserRoleAssignment::assignableFromRequest($request);
        UserRoleAssignment::sync(
            $user,
            $roles !== [] ? $roles : ['viewer'],
            $request->user()?->hasRole('super-admin') ?? false,
        );

        return $user->load(['roles', 'creator', 'updater']);
    }
}
