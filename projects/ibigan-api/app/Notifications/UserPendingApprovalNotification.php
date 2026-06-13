<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\User;
use App\Notifications\Concerns\ResolvesMessageTemplate;
use App\Support\MessageTemplateSlugs;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

final class UserPendingApprovalNotification extends Notification
{
    use Queueable;
    use ResolvesMessageTemplate;

    public function __construct(private readonly User $user) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, int|string>
     */
    public function toArray(object $notifiable): array
    {
        $content = $this->resolveTemplate($notifiable);

        return [
            'type' => 'user_pending_approval',
            'user_id' => $this->user->id,
            'user_name' => $this->user->name,
            'user_email' => $this->user->email,
            'subject' => $content['subject'],
            'body' => $content['body'],
            'slug' => $content['slug'],
        ];
    }

    protected function templateSlug(): string
    {
        return MessageTemplateSlugs::USER_PENDING_APPROVAL;
    }

    /**
     * @return array<string, string>
     */
    protected function mergeData(object $notifiable): array
    {
        return [
            'user_name' => (string) $this->user->name,
            'user_email' => (string) $this->user->email,
        ];
    }
}
