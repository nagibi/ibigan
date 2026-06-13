<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Notifications\Concerns\ResolvesMessageTemplate;
use App\Support\MessageTemplateSlugs;
use App\Support\PlainTextMailMessageBuilder;
use App\Support\SystemMessageTemplates;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

final class ResetPasswordNotification extends Notification
{
    use Queueable;
    use ResolvesMessageTemplate;

    public function __construct(
        private readonly string $token,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $content = $this->resolveTemplate($notifiable);
        $resetUrl = $this->resetUrl($notifiable);

        return PlainTextMailMessageBuilder::build(
            $content['subject'],
            $content['body'],
            SystemMessageTemplates::PASSWORD_RESET_ACTION_LABEL,
            $resetUrl,
        );
    }

    protected function templateSlug(): string
    {
        return MessageTemplateSlugs::PASSWORD_RESET;
    }

    /**
     * @return array<string, string>
     */
    protected function mergeData(object $notifiable): array
    {
        $resetUrl = $this->resetUrl($notifiable);

        return [
            'name' => (string) ($notifiable->name ?? 'Usuário'),
            'email' => (string) ($notifiable->email ?? ''),
            'link' => $resetUrl,
        ];
    }

    private function resetUrl(object $notifiable): string
    {
        $frontendUrl = rtrim((string) config('app.frontend_url', url('/')), '/');
        $tenantId = tenant()?->id;
        $query = http_build_query(array_filter([
            'token' => $this->token,
            'email' => $notifiable->email ?? null,
            'tenant_id' => is_string($tenantId) ? $tenantId : null,
        ]));

        return "{$frontendUrl}/auth/forgot-password?{$query}";
    }
}
