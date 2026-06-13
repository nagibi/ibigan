<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\MessageTemplate;
use App\Services\TemplateMailService;

final class SystemMessageTemplates
{
    public const REPORT_COMPLETED_ACTION_LABEL = 'Download';

    /**
     * @param  array<string, string>  $data
     * @return array{subject: string, body: string}
     */
    public static function resolveReportCompleted(array $data): array
    {
        $definition = self::definitions()[0];
        $service = app(TemplateMailService::class);

        return [
            'subject' => $service->replace((string) $definition['subject'], $data),
            'body' => trim($service->replace((string) $definition['body'], $data)),
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    public static function definitions(): array
    {
        return [
            [
                'name'       => 'Relatório pronto',
                'slug'       => MessageTemplateSlugs::REPORT_COMPLETED,
                'subject'    => 'Relatório pronto: {{report_name}}',
                'body'       => <<<'TEXT'
Hello!

Seu relatório {{report_name}} foi processado com sucesso.

{{rows_summary}}.

O resultado estará disponível por 7 dias.
TEXT,
                'merge_tags' => [
                    '{{report_name}}',
                    '{{rows_summary}}',
                ],
                'is_active'  => true,
            ],
        ];
    }

    public static function seed(): void
    {
        foreach (self::definitions() as $template) {
            MessageTemplate::updateOrCreate(
                ['slug' => $template['slug']],
                $template,
            );
        }
    }
}
