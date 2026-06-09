<?php

declare(strict_types=1);

namespace App\Actions\MessageTemplate;

use App\Models\MessageTemplate;
use App\Repositories\Contracts\MessageTemplateRepositoryInterface;

final class DuplicateMessageTemplateAction
{
    public function __construct(
        private readonly MessageTemplateRepositoryInterface $messageTemplateRepository,
    ) {}

    public function execute(MessageTemplate $messageTemplate): MessageTemplate
    {
        return $this->messageTemplateRepository->create([
            'name' => $messageTemplate->name.' (cópia)',
            'slug' => $this->uniqueSlug($messageTemplate->slug),
            'subject' => $messageTemplate->subject,
            'body' => $messageTemplate->body,
            'merge_tags' => $messageTemplate->merge_tags,
            'is_active' => false,
        ]);
    }

    private function uniqueSlug(string $base): string
    {
        $slug = $base.'-copia';
        $counter = 2;

        while (MessageTemplate::query()->where('slug', $slug)->exists()) {
            $slug = $base.'-copia-'.$counter;
            $counter++;
        }

        return $slug;
    }
}
