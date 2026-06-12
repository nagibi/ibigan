<?php

declare(strict_types=1);

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

final class UserRejectedNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly ?string $reason = null) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $msg = (new MailMessage)
            ->subject('Cadastro não aprovado')
            ->line('Infelizmente seu cadastro não foi aprovado.');

        if ($this->reason) {
            $msg->line("Motivo: {$this->reason}");
        }

        return $msg->line('Entre em contato com o administrador para mais informações.');
    }

    /**
     * @return array<string, string|null>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'user_rejected',
            'reason' => $this->reason,
        ];
    }
}
