<?php

declare(strict_types=1);

namespace App\Rules;

use App\Support\BrazilianDocuments;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

final class Cnpj implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if ($value === null || $value === '') {
            return;
        }

        $cnpj = BrazilianDocuments::digitsOnly((string) $value);

        if ($cnpj === null || ! BrazilianDocuments::isValidCnpj($cnpj)) {
            $fail('O CNPJ informado é inválido.');
        }
    }
}
