<?php

declare(strict_types=1);

namespace App\Http\Requests\Central;

use App\Models\Central\CentralUser;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

final class UpdateCentralUserRequest extends FormRequest
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
        /** @var CentralUser|null $centralUser */
        $centralUser = $this->route('centralUser');

        return [
            'name' => ['required', 'string', 'min:2', 'max:255'],
            'email' => [
                'required',
                'email:rfc',
                'max:255',
                Rule::unique(CentralUser::class, 'email')->ignore($centralUser?->id),
            ],
            'is_active' => ['required', 'boolean'],
            'password' => ['nullable', 'string', 'confirmed', Password::defaults()],
        ];
    }
}
