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
            'merge_data' => ['sometimes', 'array'],
            'merge_data.*' => ['nullable', 'string', 'max:65535'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function mergeData(): array
    {
        $mergeData = $this->validated('merge_data');

        if (! is_array($mergeData)) {
            return [];
        }

        $normalized = [];

        foreach ($mergeData as $tag => $value) {
            if (! is_string($tag)) {
                continue;
            }

            $normalized[$tag] = is_string($value) ? $value : (string) $value;
        }

        return $normalized;
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
