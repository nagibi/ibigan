<?php

declare(strict_types=1);

namespace App\Actions\Auth;

use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;

final class ResetPasswordAction
{
    public function execute(ResetPasswordRequest $request): void
    {
        $tenant = Tenant::find($request->validated('tenant_id'));

        if (! $tenant) {
            throw ValidationException::withMessages([
                'tenant_id' => ['Organização não encontrada.'],
            ]);
        }

        $tenant->run(function () use ($request): void {
            $status = Password::broker()->reset(
                [
                    'email' => $request->validated('email'),
                    'password' => $request->validated('password'),
                    'password_confirmation' => $request->validated('password_confirmation'),
                    'token' => $request->validated('token'),
                ],
                function (User $user, string $password): void {
                    $user->forceFill([
                        'password' => Hash::make($password),
                    ])->save();

                    $user->tokens()->delete();
                }
            );

            if ($status !== Password::PASSWORD_RESET) {
                throw ValidationException::withMessages([
                    'token' => [__($status)],
                ]);
            }
        });
    }
}
