<?php

declare(strict_types=1);

namespace App\Http\Requests\Translation;

use App\Models\Central\PlatformTranslation;
use App\Models\Tenant;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateTranslationRequest extends FormRequest
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
        $translationId = (int) $this->route('tenantTranslation');

        $existing = PlatformTranslation::query()
            ->forTenant($tenant->id)
            ->find($translationId);

        $locale = $this->input('locale', $existing?->locale);
        $key = $this->input('key', $existing?->key);

        return [
            'key' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique(PlatformTranslation::class, 'key')
                    ->where('tenant_id', $tenant->id)
                    ->where('locale', $locale)
                    ->ignore($translationId),
            ],
            'locale' => ['sometimes', 'string', Rule::in(['pt', 'en'])],
            'value' => ['sometimes', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
