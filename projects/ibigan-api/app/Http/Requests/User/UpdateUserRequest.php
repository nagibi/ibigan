<?php

declare(strict_types=1);

namespace App\Http\Requests\User;

use App\Http\Requests\Concerns\SanitizesBrazilianFields;
use App\Rules\AssignableRole;
use App\Rules\Cpf;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateUserRequest extends FormRequest
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

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:255'],
            'email' => [
                'required',
                'email:rfc',
                'max:255',
                Rule::unique('users', 'email')->ignore($this->route('user')),
            ],
            'cpf' => [
                'nullable',
                'string',
                'size:11',
                new Cpf,
                Rule::unique('users', 'cpf')->ignore($this->route('user')),
            ],
            'phone' => ['nullable', 'string', 'regex:/^\d{10,11}$/'],
            'birth_date' => ['nullable', 'date', 'before:today'],
            'gender' => ['nullable', 'string', 'in:male,female,other,prefer_not_to_say'],
            'bio' => ['nullable', 'string', 'max:500'],
            'roles' => ['sometimes', 'array', 'min:1'],
            'roles.*' => ['string', new AssignableRole($this->user())],
            'role' => ['sometimes', 'string', new AssignableRole($this->user())],
        ];
    }
}
