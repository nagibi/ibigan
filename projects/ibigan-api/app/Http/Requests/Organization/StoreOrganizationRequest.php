<?php

declare(strict_types=1);

namespace App\Http\Requests\Organization;

use App\Enums\OrganizationStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class StoreOrganizationRequest extends FormRequest
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
            'name' => ['required', 'string', 'min:2', 'max:255'],
            'slug' => ['required', 'string', 'max:255', Rule::unique('organizations', 'slug')],
            'status' => ['sometimes', Rule::enum(OrganizationStatus::class)],
            'description' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
