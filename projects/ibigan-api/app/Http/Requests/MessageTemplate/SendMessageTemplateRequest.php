<?php

declare(strict_types=1);

namespace App\Http\Requests\MessageTemplate;

use Illuminate\Foundation\Http\FormRequest;

final class SendMessageTemplateRequest extends FormRequest
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
            'to' => ['required', 'email:rfc'],
            'data' => ['nullable', 'array'],
        ];
    }
}
