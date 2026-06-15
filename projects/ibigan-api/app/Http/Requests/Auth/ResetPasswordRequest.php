<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use App\Services\TenantContextResolver;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

final class ResetPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->filled('tenant_id')) {
            return;
        }

        $tenantId = app(TenantContextResolver::class)->resolveTenantId($this);

        if ($tenantId !== null) {
            $this->merge(['tenant_id' => $tenantId]);
        }
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'email:rfc'],
            'token' => ['required', 'string'],
            'tenant_id' => ['required', 'string'],
            'password' => ['required', 'string', Password::min(8)->letters()->numbers(), 'confirmed'],
        ];
    }
}
