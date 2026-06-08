<?php

declare(strict_types=1);

namespace App\Actions\MessageTemplate;

use App\Http\Requests\MessageTemplate\StoreMessageTemplateRequest;
use App\Models\MessageTemplate;
use App\Repositories\Contracts\MessageTemplateRepositoryInterface;

final class CreateMessageTemplateAction
{
    public function __construct(
        private readonly MessageTemplateRepositoryInterface $messageTemplateRepository,
    ) {}

    public function execute(StoreMessageTemplateRequest $request): MessageTemplate
    {
        return $this->messageTemplateRepository->create([
            'name' => $request->validated('name'),
            'slug' => $request->validated('slug'),
            'subject' => $request->validated('subject'),
            'channel' => $request->validated('channel'),
            'body' => $request->validated('body'),
            'merge_tags' => $request->validated('merge_tags'),
            'is_active' => $request->validated('is_active', true),
        ]);
    }
}
