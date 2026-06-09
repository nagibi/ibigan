<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Actions\MessageTemplate\CreateMessageTemplateAction;
use App\Actions\MessageTemplate\DuplicateMessageTemplateAction;
use App\Actions\MessageTemplate\UpdateMessageTemplateAction;
use App\Data\MessageTemplateData;
use App\Http\Controllers\Controller;
use App\Http\Requests\MessageTemplate\SendMessageTemplateRequest;
use App\Http\Requests\MessageTemplate\StoreMessageTemplateRequest;
use App\Http\Requests\MessageTemplate\UpdateMessageTemplateRequest;
use App\Jobs\SendTemplateEmailJob;
use App\Jobs\SendTemplateNotificationJob;
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
        private readonly DuplicateMessageTemplateAction $duplicateMessageTemplateAction,
        private readonly UpdateMessageTemplateAction $updateMessageTemplateAction,
    ) {}

    /**
     * Listar templates de mensagem paginados.
     *
     * Requer permissão `template-visualizar`.
     */
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('template-visualizar'), Response::HTTP_FORBIDDEN);

        $messageTemplates = $this->messageTemplateRepository->paginate(
            perPage: $request->integer('per_page', 15),
            filters: $request->only(['search', 'is_active']),
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

    /**
     * Retornar um template de mensagem específico.
     */
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

    /**
     * Criar template de mensagem.
     *
     * Requer permissão `template-gerenciar`.
     */
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

    /**
     * Atualizar template de mensagem.
     */
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

    /**
     * Duplicar template de mensagem.
     *
     * Requer permissão `template-gerenciar`. A cópia é criada inativa.
     */
    public function duplicate(Request $request, MessageTemplate $messageTemplate): JsonResponse
    {
        abort_unless($request->user()->can('template-gerenciar'), Response::HTTP_FORBIDDEN);

        $duplicate = $this->duplicateMessageTemplateAction->execute($messageTemplate);

        return response()->json([
            'status' => 1,
            'message' => 'MSG000424',
            'result' => MessageTemplateData::fromModel($duplicate),
        ], Response::HTTP_CREATED);
    }

    /**
     * Remover template de mensagem.
     */
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

    /**
     * Enviar mensagem usando template e merge tags nos canais informados.
     *
     * Requer permissão `template-gerenciar`. O envio é processado em fila.
     */
    public function send(SendMessageTemplateRequest $request, MessageTemplate $messageTemplate): JsonResponse
    {
        abort_unless($request->user()->can('template-gerenciar'), Response::HTTP_FORBIDDEN);

        abort_unless($messageTemplate->is_active, Response::HTTP_UNPROCESSABLE_ENTITY);

        $channels = $request->validated('channels');
        $recipients = $request->validated('recipients');
        $data = $request->validated('data', []);

        foreach ($channels as $channel) {
            foreach ($recipients as $recipient) {
                match ($channel) {
                    'email' => SendTemplateEmailJob::dispatch(
                        $messageTemplate->slug,
                        $recipient,
                        $data,
                    ),
                    'notification' => SendTemplateNotificationJob::dispatch(
                        $messageTemplate->slug,
                        $recipient,
                        $data,
                    ),
                    default => null,
                };
            }
        }

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'description' => 'Mensagens enfileiradas com sucesso!',
            'result' => [
                'queued' => count($channels) * count($recipients),
                'channels' => $channels,
                'recipients' => count($recipients),
            ],
        ]);
    }
}
