<?php

declare(strict_types=1);

namespace App\Http\Requests\Concerns;

use App\Support\BrazilianDocuments;

trait SanitizesBrazilianFields
{
    /**
     * @param  list<string>  $fields
     */
    protected function sanitizeDigits(array $fields): void
    {
        $payload = [];

        foreach ($fields as $field) {
            if (! $this->has($field)) {
                continue;
            }

            $payload[$field] = BrazilianDocuments::digitsOnly($this->input($field));
        }

        if ($payload !== []) {
            $this->merge($payload);
        }
    }
}
