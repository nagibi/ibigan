<?php

declare(strict_types=1);

namespace App\Actions\MessageTemplate;

use App\Http\Requests\MessageTemplate\UpdateMessageTemplateRequest;
use App\Models\MessageTemplate;
use App\Support\PlatformCatalogGuard;
use App\Repositories\Contracts\MessageTemplateRepositoryInterface;

final class UpdateMessageTemplateAction
{
    public function __construct(
        private readonly MessageTemplateRepositoryInterface $messageTemplateRepository,
    ) {}

    public function execute(MessageTemplate $messageTemplate, UpdateMessageTemplateRequest $request): MessageTemplate
    {
        PlatformCatalogGuard::ensureCanEdit($messageTemplate);

        $validated = $request->validated();

        PlatformCatalogGuard::ensureCanChangeSlug(
            $messageTemplate,
            $validated['slug'] ?? null,
        );

        return $this->messageTemplateRepository->update($messageTemplate, $validated);
    }
}
