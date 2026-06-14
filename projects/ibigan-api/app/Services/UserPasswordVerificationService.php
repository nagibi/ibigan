<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Central\CentralUser;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

final class UserPasswordVerificationService
{
    public function verifyCurrentPassword(User $user, string $password): void
    {
        if ($user->is_platform_user) {
            $centralUser = CentralUser::query()
                ->where('email', $user->email)
                ->where('is_active', true)
                ->first();

            if ($centralUser === null || ! Hash::check($password, $centralUser->password)) {
                throw ValidationException::withMessages([
                    'password' => ['Senha incorreta.'],
                ]);
            }

            return;
        }

        if (! Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'password' => ['Senha incorreta.'],
            ]);
        }
    }
}
