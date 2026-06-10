<?php

declare(strict_types=1);

namespace App\Rules;

use App\Support\BrazilianDocuments;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

final class Cpf implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if ($value === null || $value === '') {
            return;
        }

        $cpf = BrazilianDocuments::digitsOnly((string) $value);

        if ($cpf === null || ! BrazilianDocuments::isValidCpf($cpf)) {
            $fail('O CPF informado é inválido.');
        }
    }
}
