<?php

declare(strict_types=1);

namespace App\Actions\MessageTemplate;

use App\Jobs\SendTemplateEmailJob;
use App\Jobs\SendTemplateNotificationJob;
use App\Mail\TemplateMailable;
use App\Models\Central\PlatformMessageTemplate;
use App\Models\MessageTemplate;
use App\Models\User;
use App\Services\TemplateMailService;
use Illuminate\Support\Facades\Mail;

final class SendMessageTemplateTestAction
{
    public function __construct(
        private readonly TemplateMailService $templateMailService,
    ) {}

    /**
     * @param  list<string>  $channels
     * @param  array<string, string>  $mergeData
     * @return array{queued: int, recipient: string}
     */
    public function executeForTenant(
        MessageTemplate $template,
        User $user,
        array $channels,
        array $mergeData = [],
    ): array {
        abort_unless($template->is_active, 422, 'Template inativo.');

        $data = $this->resolveMergeData($user, $mergeData);
        $queued = 0;

        foreach ($channels as $channel) {
            match ($channel) {
                'email' => SendTemplateEmailJob::dispatch($template->slug, $user->email, $data),
                'notification' => SendTemplateNotificationJob::dispatch($template->slug, $user->email, $data),
                default => null,
            };

            if (in_array($channel, ['email', 'notification'], true)) {
                $queued++;
            }
        }

        return [
            'queued' => $queued,
            'recipient' => $user->email,
        ];
    }

    /**
     * @param  list<string>  $channels
     * @param  array<string, string>  $mergeData
     * @return array{queued: int, recipient: string}
     */
    public function executeForPlatform(
        PlatformMessageTemplate $template,
        object $user,
        array $channels,
        array $mergeData = [],
    ): array {
        abort_unless($template->is_active, 422, 'Template inativo.');

        $data = $this->resolveMergeData($user, $mergeData);
        $subject = $this->templateMailService->replace($template->subject, $data);
        $body = $this->templateMailService->replace($template->body, $data);
        $queued = 0;

        foreach ($channels as $channel) {
            if ($channel === 'email') {
                Mail::to($user->email)->send(new TemplateMailable($subject, $body));
                $queued++;
            }
        }

        return [
            'queued' => $queued,
            'recipient' => $user->email,
        ];
    }

    /**
     * @param  array<string, string>  $mergeData
     * @return array<string, string>
     */
    private function resolveMergeData(object $user, array $mergeData): array
    {
        $defaults = $this->mergeDataForUser($user);

        foreach ($mergeData as $tag => $value) {
            if (! is_string($tag)) {
                continue;
            }

            $defaults[$tag] = (string) $value;
        }

        return $defaults;
    }

    /**
     * @return array<string, string>
     */
    private function mergeDataForUser(object $user): array
    {
        return [
            'nome' => (string) ($user->name ?? ''),
            'name' => (string) ($user->name ?? ''),
            'email' => (string) ($user->email ?? ''),
        ];
    }
}
