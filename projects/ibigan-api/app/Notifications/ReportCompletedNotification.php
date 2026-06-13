<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Mail\TemplateMailable;
use App\Models\MessageTemplate;
use App\Models\ReportExecution;
use App\Services\TemplateMailService;
use App\Support\MessageTemplateSlugs;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\URL;

final class ReportCompletedNotification extends Notification implements ShouldBroadcast
{
    use Queueable;

    /** @var array{subject: string, body: string, slug: string}|null */
    private ?array $resolvedContent = null;

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

    public function toMail(object $notifiable): TemplateMailable
    {
        $content = $this->resolvedContent($notifiable);

        return new TemplateMailable(
            emailSubject: $content['subject'],
            emailBody: $content['body'],
        );
    }

    public function toArray(object $notifiable): array
    {
        $content = $this->resolvedContent($notifiable);

        return [
            'execution_id' => $this->execution->id,
            'template_id' => $this->execution->report_template_id,
            'template_name' => $this->execution->template->name,
            'rows_count' => $this->execution->result_rows_count,
            'duration_ms' => $this->execution->duration_ms,
            'subject' => $content['subject'],
            'body' => $content['body'],
            'slug' => $content['slug'],
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }

    /**
     * @return array{subject: string, body: string, slug: string}
     */
    private function resolvedContent(object $notifiable): array
    {
        if ($this->resolvedContent !== null) {
            return $this->resolvedContent;
        }

        $data = $this->mergeData($notifiable);
        $template = MessageTemplate::query()
            ->where('slug', MessageTemplateSlugs::REPORT_COMPLETED)
            ->where('is_active', true)
            ->first();

        if ($template !== null) {
            $resolved = app(TemplateMailService::class)->resolve($template, $data);

            return $this->resolvedContent = [
                'subject' => $resolved['subject'],
                'body' => $resolved['body'],
                'slug' => $template->slug,
            ];
        }

        return $this->resolvedContent = [
            'subject' => "Relatório pronto: {$data['report_name']}",
            'body' => <<<HTML
<p>Olá, {$data['name']}!</p>
<p>Seu relatório <strong>{$data['report_name']}</strong> foi processado com sucesso.</p>
<p>{$data['rows_count']} registros encontrados em {$data['duration_ms']}.</p>
<p><a href="{$data['download_url']}">Baixar resultado</a></p>
<p>O arquivo estará disponível até {$data['expires_at']}.</p>
HTML,
            'slug' => MessageTemplateSlugs::REPORT_COMPLETED,
        ];
    }

    /**
     * @return array<string, string>
     */
    private function mergeData(object $notifiable): array
    {
        $expiresAt = $this->execution->result_expires_at ?? now()->addDays(7);
        $rowsCount = (int) ($this->execution->result_rows_count ?? 0);

        $downloadUrl = URL::temporarySignedRoute(
            'reports.executions.download',
            $expiresAt,
            [
                'tenant' => tenant()->id,
                'report' => $this->execution->report_template_id,
                'execution' => $this->execution->id,
            ],
        );

        return [
            'name' => (string) ($notifiable->name ?? 'Usuário'),
            'report_name' => (string) $this->execution->template->name,
            'rows_count' => (string) $rowsCount,
            'duration_ms' => number_format((int) ($this->execution->duration_ms ?? 0), 0, ',', '.').'ms',
            'download_url' => $downloadUrl,
            'expires_at' => $expiresAt->timezone(config('app.timezone'))->format('d/m/Y H:i'),
        ];
    }
}
