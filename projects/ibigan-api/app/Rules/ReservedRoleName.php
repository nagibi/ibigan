<?php

declare(strict_types=1);

namespace App\Rules;

use App\Support\SystemRoles;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

final class ReservedRoleName implements ValidationRule
{
    public function __construct(
        private readonly ?string $ignoreName = null,
    ) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value)) {
            return;
        }

        if ($this->ignoreName !== null && $value === $this->ignoreName) {
            return;
        }

        if (SystemRoles::isSystem($value)) {
            $fail('Este nome de papel é reservado pelo sistema.');
        }
    }
}
