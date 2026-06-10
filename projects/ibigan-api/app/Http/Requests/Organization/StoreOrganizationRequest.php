<?php

declare(strict_types=1);

namespace App\Http\Requests\Organization;

use App\Enums\OrganizationStatus;
use App\Http\Requests\Concerns\SanitizesBrazilianFields;
use App\Rules\Cnpj;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class StoreOrganizationRequest extends FormRequest
{
    use SanitizesBrazilianFields;

    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->sanitizeDigits(['cnpj']);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:255'],
            'slug' => ['required', 'string', 'max:255', Rule::unique('organizations', 'slug')],
            'cnpj' => ['nullable', 'string', 'size:14', new Cnpj, Rule::unique('organizations', 'cnpj')],
            'status' => ['sometimes', Rule::enum(OrganizationStatus::class)],
            'description' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
