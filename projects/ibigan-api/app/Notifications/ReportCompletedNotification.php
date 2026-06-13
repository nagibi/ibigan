<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\MessageTemplate;
use App\Models\ReportExecution;
use App\Services\TemplateMailService;
use App\Support\MessageTemplateSlugs;
use App\Support\SystemMessageTemplates;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
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

    public function toMail(object $notifiable): MailMessage
    {
        $data = $this->mergeData($notifiable);
        $content = SystemMessageTemplates::resolveReportCompleted($data);
        $parts = $this->bodyParts($content['body']);

        return (new MailMessage)
            ->subject($content['subject'])
            ->greeting($parts[0] ?? 'Hello!')
            ->line($parts[1] ?? '')
            ->line($parts[2] ?? '')
            ->action(SystemMessageTemplates::REPORT_COMPLETED_ACTION_LABEL, $data['download_url'])
            ->line($parts[3] ?? 'O resultado estará disponível por 7 dias.');
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
            $body = trim($resolved['body']);

            if (self::containsHtml($body)) {
                $body = SystemMessageTemplates::resolveReportCompleted($data)['body'];
            }

            return $this->resolvedContent = [
                'subject' => $resolved['subject'],
                'body' => $body,
                'slug' => $template->slug,
            ];
        }

        $service = app(TemplateMailService::class);
        $defaults = SystemMessageTemplates::definitions()[0];

        return $this->resolvedContent = [
            'subject' => $service->replace((string) $defaults['subject'], $data),
            'body' => trim($service->replace((string) $defaults['body'], $data)),
            'slug' => MessageTemplateSlugs::REPORT_COMPLETED,
        ];
    }

    /**
     * @return list<string>
     */
    private function bodyParts(string $body): array
    {
        $parts = preg_split("/\R(?:\s*\R)+/", trim($body)) ?: [];

        return array_values(array_filter(
            array_map(static fn (string $part): string => trim($part), $parts),
            static fn (string $part): bool => $part !== '',
        ));
    }

    private static function containsHtml(string $body): bool
    {
        return preg_match('/<\s*\/?\s*(p|a|div|span|h[1-6]|br|strong|em|ul|ol|li|table)\b/i', $body) === 1;
    }

    /**
     * @return array<string, string>
     */
    private function mergeData(object $notifiable): array
    {
        $expiresAt = $this->execution->result_expires_at ?? now()->addDays(7);
        $rowsCount = (int) ($this->execution->result_rows_count ?? 0);
        $durationMs = (int) ($this->execution->duration_ms ?? 0);

        $downloadUrl = URL::temporarySignedRoute(
            'reports.executions.download',
            $expiresAt,
            [
                'tenant' => tenant()->id,
                'report' => $this->execution->report_template_id,
                'execution' => $this->execution->id,
            ],
        );

        $rowsSummary = $rowsCount === 1
            ? "1 registro encontrado em {$durationMs}ms"
            : "{$rowsCount} registros encontrados em {$durationMs}ms";

        return [
            'name' => (string) ($notifiable->name ?? 'Usuário'),
            'report_name' => (string) $this->execution->template->name,
            'rows_summary' => $rowsSummary,
            'rows_count' => (string) $rowsCount,
            'duration_ms' => (string) $durationMs,
            'download_url' => $downloadUrl,
            'expires_at' => $expiresAt->timezone(config('app.timezone'))->format('d/m/Y H:i'),
        ];
    }
}
