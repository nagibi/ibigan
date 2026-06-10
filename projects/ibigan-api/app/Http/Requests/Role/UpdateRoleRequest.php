<?php

declare(strict_types=1);

namespace App\Http\Requests\Role;

use App\Rules\ReservedRoleName;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;

final class UpdateRoleRequest extends FormRequest
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
        /** @var Role $role */
        $role = $this->route('role');

        return [
            'name' => [
                'required',
                'string',
                'min:2',
                'max:255',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('roles', 'name')
                    ->where('guard_name', 'sanctum')
                    ->ignore($role->id),
                new ReservedRoleName($role->name),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.regex' => 'O nome do papel deve usar letras minúsculas, números e hífens (ex.: suporte-nivel-1).',
        ];
    }
}
