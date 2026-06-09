<?php

declare(strict_types=1);

namespace App\Http\Requests\Campaign;

use Illuminate\Foundation\Http\FormRequest;

final class StoreCampaignRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'template_id' => ['nullable', 'integer', 'exists:message_templates,id'],
            'subject' => ['nullable', 'string'],
            'body' => ['nullable', 'string'],
            'merge_data' => ['nullable', 'array'],
            'channels' => ['required', 'array', 'min:1'],
            'channels.*' => ['required', 'string', 'in:email,notification,sms,whatsapp'],
            'scheduled_at' => ['nullable', 'date', 'after:now'],
            'recipients' => ['required', 'array', 'min:1'],
            'recipients.*.type' => ['required', 'string', 'in:all,role,permission,organization,user'],
            'recipients.*.value' => ['nullable', 'string'],
        ];
    }
}
