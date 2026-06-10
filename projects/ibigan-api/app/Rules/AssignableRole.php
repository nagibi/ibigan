<?php

declare(strict_types=1);

namespace App\Rules;

use App\Models\User;
use App\Support\SystemRoles;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Spatie\Permission\Models\Role;

final class AssignableRole implements ValidationRule
{
    public function __construct(
        private readonly ?User $actor = null,
    ) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || $value === '') {
            $fail('Selecione um papel válido.');

            return;
        }

        if (SystemRoles::isProtected($value) && ! $this->actorCanAssignProtected()) {
            $fail('Apenas super-admin pode atribuir este papel.');

            return;
        }

        if (! Role::query()->where('name', $value)->where('guard_name', 'sanctum')->exists()) {
            $fail('O papel selecionado é inválido.');

            return;
        }
    }

    private function actorCanAssignProtected(): bool
    {
        return $this->actor?->hasRole('super-admin') ?? false;
    }
}
