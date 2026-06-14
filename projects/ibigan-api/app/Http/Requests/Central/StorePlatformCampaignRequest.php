<?php

declare(strict_types=1);

namespace App\Http\Requests\Central;

use Illuminate\Foundation\Http\FormRequest;

final class StorePlatformCampaignRequest extends FormRequest
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
            'tenant_ids' => ['required', 'array', 'min:1'],
            'tenant_ids.*' => ['required', 'string', 'distinct', 'exists:tenants,id'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'template_slug' => ['nullable', 'string', 'max:255'],
            'template_id' => ['nullable', 'integer'],
            'subject' => ['nullable', 'string'],
            'body' => ['nullable', 'string'],
            'merge_data' => ['nullable', 'array'],
            'channels' => ['required', 'array', 'min:1'],
            'channels.*' => ['required', 'string', 'in:email,notification,sms,whatsapp'],
            'scheduled_at' => ['nullable', 'date', 'after:now'],
            'recipients' => ['required', 'array', 'min:1'],
            'recipients.*.type' => ['required', 'string', 'in:all,role,permission,user,users'],
            'recipients.*.value' => ['nullable', 'string'],
        ];
    }
}
