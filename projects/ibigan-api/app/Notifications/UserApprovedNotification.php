<?php

declare(strict_types=1);

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

final class UserApprovedNotification extends Notification
{
    use Queueable;

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Seu cadastro foi aprovado!')
            ->line('Boas-vindas! Seu cadastro foi aprovado e você já pode acessar o sistema.')
            ->action('Acessar o sistema', url('/'));
    }

    /**
     * @return array<string, string>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'user_approved',
            'message' => 'Seu cadastro foi aprovado!',
        ];
    }
}
