<?php

declare(strict_types=1);

namespace App\Http\Requests\MessageTemplate;

use App\Enums\SendChannel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class TestMessageTemplateRequest extends FormRequest
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
            'channels' => ['sometimes', 'array', 'min:1'],
            'channels.*' => ['required', 'string', Rule::enum(SendChannel::class)],
        ];
    }

    /**
     * @return list<string>
     */
    public function channels(): array
    {
        $channels = $this->validated('channels');

        if (! is_array($channels) || $channels === []) {
            return ['email', 'notification'];
        }

        return array_values($channels);
    }
}
