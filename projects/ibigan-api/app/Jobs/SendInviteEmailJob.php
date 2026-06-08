<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Jobs\Concerns\TenantAwareJob;
use App\Mail\TemplateMailable;
use App\Models\Invite;
use App\Models\MessageTemplate;
use App\Services\TemplateMailService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Mail;

final class SendInviteEmailJob implements ShouldQueue
{
    use TenantAwareJob;

    public function __construct(
        private readonly int $inviteId,
    ) {}

    public function handle(TemplateMailService $templateMailService): void
    {
        $invite = Invite::query()
            ->with('invitedBy')
            ->findOrFail($this->inviteId);

        /** @var array<string, string> $data */
        $data = [
            'email' => $invite->email,
            'role' => $invite->role,
            'token' => $invite->token,
            'expires_at' => $invite->expires_at->format('d/m/Y H:i'),
            'invited_by' => $invite->invitedBy->name,
        ];

        $template = MessageTemplate::query()
            ->where('slug', 'convite')
            ->where('is_active', true)
            ->first();

        if ($template) {
            $resolved = $templateMailService->resolve($template, $data);
            $subject = $resolved['subject'];
            $body = $resolved['body'];
        } else {
            $subject = 'Convite para participar';
            $body = sprintf(
                '<p>Olá,</p><p>Você foi convidado por %s para participar com o perfil <strong>%s</strong>.</p><p>Seu token de convite: <strong>%s</strong></p><p>Expira em: %s</p>',
                e($invite->invitedBy->name),
                e($invite->role),
                e($invite->token),
                e($invite->expires_at->format('d/m/Y H:i')),
            );
        }

        Mail::to($invite->email)->send(new TemplateMailable(
            emailSubject: $subject,
            emailBody: $body,
        ));
    }
}
