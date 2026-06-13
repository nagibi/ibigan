<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\MessageTemplate;
use Illuminate\Database\Eloquent\ModelNotFoundException;

final class MessageTemplateResolver
{
    public function __construct(
        private readonly TemplateMailService $templateMailService,
    ) {}

    /**
     * @param  array<string, string>  $data
     * @return array{subject: string, body: string, slug: string}
     */
    public function resolve(string $slug, array $data): array
    {
        $template = MessageTemplate::query()
            ->where('slug', $slug)
            ->where('is_active', true)
            ->first();

        if ($template === null) {
            throw new ModelNotFoundException(
                "Template de mensagem ativo não encontrado para o slug [{$slug}].",
            );
        }

        $resolved = $this->templateMailService->resolve($template, $data);

        return [
            'subject' => $resolved['subject'],
            'body' => trim($resolved['body']),
            'slug' => $template->slug,
        ];
    }
}
