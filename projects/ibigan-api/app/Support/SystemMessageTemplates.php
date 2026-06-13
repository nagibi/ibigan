<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\MessageTemplate;

final class SystemMessageTemplates
{
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
                'body'       => <<<'HTML'
<p>Olá, {{name}}!</p>
<p>Seu relatório <strong>{{report_name}}</strong> foi processado com sucesso.</p>
<p>{{rows_count}} registros encontrados em {{duration_ms}}.</p>
<p><a href="{{download_url}}">Baixar resultado</a></p>
<p>O arquivo estará disponível até {{expires_at}}.</p>
HTML,
                'merge_tags' => [
                    '{{name}}',
                    '{{report_name}}',
                    '{{rows_count}}',
                    '{{duration_ms}}',
                    '{{download_url}}',
                    '{{expires_at}}',
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
