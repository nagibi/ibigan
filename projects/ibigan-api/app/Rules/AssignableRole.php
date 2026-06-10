<?php

declare(strict_types=1);

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Spatie\Permission\Models\Role;

final class AssignableRole implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || $value === '') {
            $fail('Selecione um papel válido.');

            return;
        }

        if ($value === 'super-admin') {
            $fail('O papel super-admin não pode ser atribuído por esta rota.');

            return;
        }

        if (! Role::query()->where('name', $value)->where('guard_name', 'sanctum')->exists()) {
            $fail('O papel selecionado é inválido.');

            return;
        }
    }
}
