<?php

declare(strict_types=1);

namespace App\Notifications\Concerns;

use App\Services\MessageTemplateResolver;

trait ResolvesMessageTemplate
{
    /** @var array{subject: string, body: string, slug: string}|null */
    private ?array $resolvedTemplateContent = null;

    /**
     * @return array{subject: string, body: string, slug: string}
     */
    protected function resolveTemplate(object $notifiable): array
    {
        if ($this->resolvedTemplateContent !== null) {
            return $this->resolvedTemplateContent;
        }

        return $this->resolvedTemplateContent = app(MessageTemplateResolver::class)->resolve(
            $this->templateSlug(),
            $this->mergeData($notifiable),
        );
    }

    abstract protected function templateSlug(): string;

    /**
     * @return array<string, string>
     */
    abstract protected function mergeData(object $notifiable): array;
}
