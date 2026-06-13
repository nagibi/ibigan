<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Jobs\Concerns\TenantAwareJob;
use App\Mail\TemplateMailable;
use App\Models\Invite;
use App\Services\MessageTemplateResolver;
use App\Support\MessageTemplateSlugs;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Mail;

final class SendInviteEmailJob implements ShouldQueue
{
    use TenantAwareJob;

    public function __construct(
        private readonly int $inviteId,
    ) {}

    public function handle(MessageTemplateResolver $templateResolver): void
    {
        $invite = Invite::query()
            ->with('invitedBy')
            ->findOrFail($this->inviteId);

        $frontendUrl = rtrim((string) config('app.frontend_url', url('/')), '/');
        $tenantId = tenant()?->id;
        $linkQuery = http_build_query(array_filter([
            'token' => $invite->token,
            'tenant_id' => is_string($tenantId) ? $tenantId : null,
        ]));

        /** @var array<string, string> $data */
        $data = [
            'email' => $invite->email,
            'role' => $invite->role,
            'token' => $invite->token,
            'expires_at' => $invite->expires_at->format('d/m/Y H:i'),
            'invited_by' => $invite->invitedBy->name,
            'link' => "{$frontendUrl}/auth/invite?{$linkQuery}",
        ];

        $resolved = $templateResolver->resolve(MessageTemplateSlugs::USER_INVITE, $data);

        Mail::to($invite->email)->send(new TemplateMailable(
            emailSubject: $resolved['subject'],
            emailBody: $resolved['body'],
        ));
    }
}
