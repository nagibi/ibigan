<?php

declare(strict_types=1);

namespace App\Http\Requests\Tenant;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateTenantSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['nullable', 'string', 'max:255'],
            'timezone' => ['nullable', 'string', Rule::in(timezone_identifiers_list())],
            'locale' => ['nullable', 'string', Rule::in(['pt_BR', 'en', 'es'])],
        ];
    }
}
