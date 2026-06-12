<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

final class UserRoleAssignment
{
    /** @var list<string> */
    public const PROTECTED = [
        'super-admin',
    ];

    /**
     * @return list<string>
     */
    public static function assignableFromRequest(FormRequest $request): array
    {
        if ($request->has('roles')) {
            /** @var list<string> $roles */
            $roles = $request->input('roles', []);

            return array_values(array_unique(array_filter($roles, fn ($role) => is_string($role) && $role !== '')));
        }

        if ($request->filled('role')) {
            return [(string) $request->input('role')];
        }

        return [];
    }

    public static function sync(User $user, array $assignableRoles, bool $actorCanAssignProtected = false): void
    {
        if ($actorCanAssignProtected) {
            // payload é a verdade — super-admin entra/sai conforme enviado
            $user->syncRoles(array_values(array_unique($assignableRoles)));

            return;
        }

        // actor sem poder: preserva protegidos existentes (comportamento atual)
        $protected = $user->getRoleNames()
            ->filter(fn (string $role): bool => in_array($role, self::PROTECTED, true))
            ->values()
            ->all();

        $user->syncRoles(array_values(array_unique([...$protected, ...$assignableRoles])));
    }
}
