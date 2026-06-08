<?php

declare(strict_types=1);

namespace App\Http\Requests\MessageTemplate;

use App\Enums\MessageTemplateChannel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class StoreMessageTemplateRequest extends FormRequest
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
            'slug' => ['required', 'string', 'max:255', Rule::unique('message_templates', 'slug')],
            'subject' => ['required', 'string', 'max:255'],
            'channel' => ['required', Rule::enum(MessageTemplateChannel::class)],
            'body' => ['required', 'string'],
            'merge_tags' => ['nullable', 'array'],
            'merge_tags.*' => ['string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
