<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\ReportExecution;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

final class ReportCompletedNotification extends Notification implements ShouldBroadcast
{
    use Queueable;

    public function __construct(
        private readonly ReportExecution $execution,
        private readonly string $channel = 'app',
    ) {}

    public function via(object $notifiable): array
    {
        return match ($this->channel) {
            'email' => ['mail'],
            'app' => ['database', 'broadcast'],
            default => ['database'],
        };
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Relatório pronto: {$this->execution->template->name}")
            ->line("Seu relatório **{$this->execution->template->name}** foi processado com sucesso.")
            ->line("{$this->execution->result_rows_count} registros encontrados em {$this->execution->duration_ms}ms.")
            ->action('Ver relatório', url("/reports/{$this->execution->report_template_id}/executar"))
            ->line('O resultado estará disponível por 7 dias.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'execution_id' => $this->execution->id,
            'template_id' => $this->execution->report_template_id,
            'template_name' => $this->execution->template->name,
            'rows_count' => $this->execution->result_rows_count,
            'duration_ms' => $this->execution->duration_ms,
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }
}
