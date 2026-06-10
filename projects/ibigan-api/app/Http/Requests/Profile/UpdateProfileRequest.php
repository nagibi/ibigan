<?php

declare(strict_types=1);

namespace App\Http\Requests\Profile;

use App\Http\Requests\Concerns\SanitizesBrazilianFields;
use App\Rules\Cpf;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateProfileRequest extends FormRequest
{
    use SanitizesBrazilianFields;

    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->sanitizeDigits(['phone', 'cpf']);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($this->user()->id),
            ],
            'cpf' => [
                'nullable',
                'string',
                'size:11',
                new Cpf,
                Rule::unique('users', 'cpf')->ignore($this->user()->id),
            ],
            'phone' => ['nullable', 'string', 'regex:/^\d{10,11}$/'],
            'birth_date' => ['nullable', 'date', 'before:today'],
            'gender' => ['nullable', 'string', 'in:male,female,other,prefer_not_to_say'],
            'bio' => ['nullable', 'string', 'max:500'],
        ];
    }
}
