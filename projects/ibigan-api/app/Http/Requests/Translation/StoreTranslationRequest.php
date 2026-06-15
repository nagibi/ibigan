<?php

declare(strict_types=1);

namespace App\Http\Requests\Translation;

use App\Models\Central\PlatformTranslation;
use App\Models\Tenant;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class StoreTranslationRequest extends FormRequest
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
        /** @var Tenant $tenant */
        $tenant = $this->route('tenant');

        return [
            'key' => [
                'required',
                'string',
                'max:255',
                Rule::unique(PlatformTranslation::class, 'key')
                    ->where('tenant_id', $tenant->id)
                    ->where('locale', $this->input('locale')),
            ],
            'locale' => ['required', 'string', Rule::in(['pt', 'en'])],
            'value' => ['required', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
