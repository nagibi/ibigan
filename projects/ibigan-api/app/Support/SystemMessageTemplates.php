<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\MessageTemplate;
use App\Services\TemplateMailService;

final class SystemMessageTemplates
{
    public const REPORT_COMPLETED_ACTION_LABEL = 'Download';

    public const USER_APPROVED_ACTION_LABEL = 'Acessar o sistema';

    public const PASSWORD_RESET_ACTION_LABEL = 'Redefinir senha';

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
            [
                'name'       => 'Convite de usuário',
                'slug'       => MessageTemplateSlugs::USER_INVITE,
                'subject'    => 'Convite para participar',
                'body'       => <<<'HTML'
<p>Olá,</p>
<p>Você foi convidado por <strong>{{invited_by}}</strong> para participar com o perfil <strong>{{role}}</strong>.</p>
<p><a href="{{link}}">Aceitar convite</a></p>
<p>Token: <strong>{{token}}</strong></p>
<p>Expira em: {{expires_at}}</p>
HTML,
                'merge_tags' => [
                    '{{invited_by}}',
                    '{{role}}',
                    '{{token}}',
                    '{{expires_at}}',
                    '{{link}}',
                ],
                'is_active'  => true,
            ],
            [
                'name'       => 'Usuário criado',
                'slug'       => MessageTemplateSlugs::USER_CREATED,
                'subject'    => 'Novo usuário cadastrado',
                'body'       => <<<'TEXT'
{{user_name}} ({{user_email}}) foi adicionado ao sistema.
TEXT,
                'merge_tags' => [
                    '{{user_name}}',
                    '{{user_email}}',
                ],
                'is_active'  => true,
            ],
            [
                'name'       => 'Cadastro aguardando aprovação',
                'slug'       => MessageTemplateSlugs::USER_PENDING_APPROVAL,
                'subject'    => 'Cadastro aguardando aprovação',
                'body'       => <<<'TEXT'
{{user_name}} ({{user_email}}) aguarda aprovação de cadastro.
TEXT,
                'merge_tags' => [
                    '{{user_name}}',
                    '{{user_email}}',
                ],
                'is_active'  => true,
            ],
            [
                'name'       => 'Usuário aprovado',
                'slug'       => MessageTemplateSlugs::USER_APPROVED,
                'subject'    => 'Seu cadastro foi aprovado!',
                'body'       => <<<'TEXT'
Hello!

Seu cadastro foi aprovado e você já pode acessar o sistema.

Clique no botão abaixo para entrar.
TEXT,
                'merge_tags' => [
                    '{{name}}',
                    '{{app_url}}',
                ],
                'is_active'  => true,
            ],
            [
                'name'       => 'Usuário rejeitado',
                'slug'       => MessageTemplateSlugs::USER_REJECTED,
                'subject'    => 'Cadastro não aprovado',
                'body'       => <<<'TEXT'
Hello!

Infelizmente seu cadastro não foi aprovado.

{{reason_line}}

Entre em contato com o administrador para mais informações.
TEXT,
                'merge_tags' => [
                    '{{name}}',
                    '{{reason_line}}',
                ],
                'is_active'  => true,
            ],
            [
                'name'       => 'Redefinição de senha',
                'slug'       => MessageTemplateSlugs::PASSWORD_RESET,
                'subject'    => 'Redefinição de senha solicitada',
                'body'       => <<<'TEXT'
Hello!

Recebemos sua solicitação de redefinição de senha.

Clique no botão abaixo para criar uma nova senha.

Este link expira em breve.
TEXT,
                'merge_tags' => [
                    '{{name}}',
                    '{{email}}',
                    '{{link}}',
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
                [
                    'name' => $template['name'],
                    'subject' => $template['subject'],
                    'body' => $template['body'],
                    'merge_tags' => $template['merge_tags'],
                    'is_active' => $template['is_active'],
                ],
            );
        }
    }
}
