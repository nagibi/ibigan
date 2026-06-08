<?php

declare(strict_types=1);

namespace App\Actions\Auth;

use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;

final class ForgotPasswordAction
{
    public function execute(ForgotPasswordRequest $request): void
    {
        $tenant = Tenant::find($request->validated('tenant_id'));

        if (! $tenant) {
            throw ValidationException::withMessages([
                'tenant_id' => ['Organização não encontrada.'],
            ]);
        }

        $tenant->run(function () use ($request): void {
            $user = User::where('email', $request->validated('email'))->first();

            if (! $user) {
                return; // silencioso por segurança
            }

            Password::broker()->sendResetLink(
                ['email' => $request->validated('email')]
            );
        });
    }
}
