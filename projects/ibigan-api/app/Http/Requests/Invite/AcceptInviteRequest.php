<?php

declare(strict_types=1);

namespace App\Http\Requests\Invite;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

final class AcceptInviteRequest extends FormRequest
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
            'token' => ['required', 'string', 'uuid'],
            'name' => ['required', 'string', 'min:2', 'max:255'],
            'password' => ['required', 'string', Password::min(8)->letters()->numbers(), 'confirmed'],
        ];
    }
}
