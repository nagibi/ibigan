<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Actions\MessageTemplate\CreateMessageTemplateAction;
use App\Actions\MessageTemplate\UpdateMessageTemplateAction;
use App\Data\MessageTemplateData;
use App\Http\Controllers\Controller;
use App\Http\Requests\MessageTemplate\SendMessageTemplateRequest;
use App\Http\Requests\MessageTemplate\StoreMessageTemplateRequest;
use App\Http\Requests\MessageTemplate\UpdateMessageTemplateRequest;
use App\Jobs\SendTemplateEmailJob;
use App\Models\MessageTemplate;
use App\Repositories\Contracts\MessageTemplateRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class MessageTemplateController extends Controller
{
    public function __construct(
        private readonly MessageTemplateRepositoryInterface $messageTemplateRepository,
        private readonly CreateMessageTemplateAction $createMessageTemplateAction,
        private readonly UpdateMessageTemplateAction $updateMessageTemplateAction,
    ) {}

    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('template-visualizar'), Response::HTTP_FORBIDDEN);

        $messageTemplates = $this->messageTemplateRepository->paginate(
            perPage: $request->integer('per_page', 15),
            filters: $request->only(['search', 'channel', 'is_active']),
        );

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'result' => [
                'data' => MessageTemplateData::collect($messageTemplates->items()),
                'meta' => [
                    'current_page' => $messageTemplates->currentPage(),
                    'last_page' => $messageTemplates->lastPage(),
                    'per_page' => $messageTemplates->perPage(),
                    'total' => $messageTemplates->total(),
                ],
            ],
        ]);
    }

    public function show(Request $request, int $messageTemplate): JsonResponse
    {
        abort_unless($request->user()->can('template-visualizar'), Response::HTTP_FORBIDDEN);

        $model = $this->messageTemplateRepository->findOrFail($messageTemplate);

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'result' => MessageTemplateData::fromModel($model),
        ]);
    }

    public function store(StoreMessageTemplateRequest $request): JsonResponse
    {
        abort_unless($request->user()->can('template-gerenciar'), Response::HTTP_FORBIDDEN);

        $messageTemplate = $this->createMessageTemplateAction->execute($request);

        return response()->json([
            'status' => 1,
            'message' => 'MSG000424',
            'result' => MessageTemplateData::fromModel($messageTemplate),
        ], Response::HTTP_CREATED);
    }

    public function update(UpdateMessageTemplateRequest $request, MessageTemplate $messageTemplate): JsonResponse
    {
        abort_unless($request->user()->can('template-gerenciar'), Response::HTTP_FORBIDDEN);

        $updatedMessageTemplate = $this->updateMessageTemplateAction->execute($messageTemplate, $request);

        return response()->json([
            'status' => 1,
            'message' => 'MSG000425',
            'result' => MessageTemplateData::fromModel($updatedMessageTemplate),
        ]);
    }

    public function destroy(Request $request, MessageTemplate $messageTemplate): JsonResponse
    {
        abort_unless($request->user()->can('template-gerenciar'), Response::HTTP_FORBIDDEN);

        $this->messageTemplateRepository->delete($messageTemplate);

        return response()->json([
            'status' => 1,
            'message' => 'MSG000426',
            'result' => null,
        ]);
    }

    public function send(SendMessageTemplateRequest $request, MessageTemplate $messageTemplate): JsonResponse
    {
        abort_unless($request->user()->can('template-gerenciar'), Response::HTTP_FORBIDDEN);

        abort_unless($messageTemplate->is_active, Response::HTTP_UNPROCESSABLE_ENTITY);

        SendTemplateEmailJob::dispatch(
            $messageTemplate->slug,
            $request->validated('to'),
            $request->validated('data', []),
        );

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'description' => 'E-mail enfileirado com sucesso!',
            'result' => null,
        ]);
    }
}
