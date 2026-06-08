<?php

declare(strict_types=1);

namespace App\Actions\MessageTemplate;

use App\Http\Requests\MessageTemplate\UpdateMessageTemplateRequest;
use App\Models\MessageTemplate;
use App\Repositories\Contracts\MessageTemplateRepositoryInterface;

final class UpdateMessageTemplateAction
{
    public function __construct(
        private readonly MessageTemplateRepositoryInterface $messageTemplateRepository,
    ) {}

    public function execute(MessageTemplate $messageTemplate, UpdateMessageTemplateRequest $request): MessageTemplate
    {
        return $this->messageTemplateRepository->update($messageTemplate, $request->validated());
    }
}
