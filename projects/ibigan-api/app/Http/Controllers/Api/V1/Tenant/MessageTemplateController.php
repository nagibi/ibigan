<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Actions\MessageTemplate\CreateMessageTemplateAction;
use App\Actions\MessageTemplate\DuplicateMessageTemplateAction;
use App\Actions\MessageTemplate\UpdateMessageTemplateAction;
use App\Data\MessageTemplateData;
use App\Http\Controllers\Concerns\TogglesModelActive;
use App\Http\Controllers\Controller;
use App\Http\Requests\ToggleActiveRequest;
use App\Actions\MessageTemplate\SendMessageTemplateTestAction;
use App\Http\Requests\MessageTemplate\TestMessageTemplateRequest;
use App\Http\Requests\MessageTemplate\StoreMessageTemplateRequest;
use App\Http\Requests\MessageTemplate\UpdateMessageTemplateRequest;
use App\Models\MessageTemplate;
use App\Support\PlatformCatalogGuard;
use App\Repositories\Contracts\MessageTemplateRepositoryInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

final class MessageTemplateController extends Controller
{
    use TogglesModelActive;

    public function __construct(
        private readonly MessageTemplateRepositoryInterface $messageTemplateRepository,
        private readonly CreateMessageTemplateAction $createMessageTemplateAction,
        private readonly DuplicateMessageTemplateAction $duplicateMessageTemplateAction,
        private readonly UpdateMessageTemplateAction $updateMessageTemplateAction,
        private readonly SendMessageTemplateTestAction $sendMessageTemplateTestAction,
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
            filters: $request->only(['search', 'is_active', 'filter_id', 'filter_name', 'filter_slug']),
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

        PlatformCatalogGuard::ensureCanEdit($messageTemplate);

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
     * Ativar ou inativar template de mensagem.
     *
     * Requer permissão `template-gerenciar`.
     */
    public function toggleActive(ToggleActiveRequest $request, MessageTemplate $messageTemplate): JsonResponse
    {
        return $this->performToggleActive($request, $messageTemplate);
    }

    protected function toggleActivePermission(): string
    {
        return 'template-gerenciar';
    }

    protected function formatToggleActiveResult(Model $model): MessageTemplateData
    {
        /** @var MessageTemplate $model */
        return MessageTemplateData::fromModel($model);
    }

    /**
     * Remover template de mensagem.
     */
    public function destroy(Request $request, MessageTemplate $messageTemplate): JsonResponse
    {
        abort_unless($request->user()->can('template-gerenciar'), Response::HTTP_FORBIDDEN);

        PlatformCatalogGuard::ensureCanDelete($messageTemplate);

        $this->messageTemplateRepository->delete($messageTemplate);

        return response()->json([
            'status' => 1,
            'message' => 'MSG000426',
            'result' => null,
        ]);
    }

    /**
     * Fazer upload de imagem para uso no corpo HTML do template.
     */
    public function uploadImage(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('template-gerenciar'), Response::HTTP_FORBIDDEN);

        $request->validate([
            'image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp,gif', 'max:5120'],
        ]);

        $path = $request->file('image')->store('message-templates/images', 'public');

        /** @var FilesystemAdapter $publicDisk */
        $publicDisk = Storage::disk('public');

        return response()->json([
            'status' => 1,
            'message' => 'MSG000425',
            'result' => [
                'url' => $publicDisk->url($path),
            ],
        ]);
    }

    /**
     * Enviar teste do template para o usuário autenticado.
     *
     * Requer permissão `template-gerenciar`.
     */
    public function testSend(TestMessageTemplateRequest $request, MessageTemplate $messageTemplate): JsonResponse
    {
        abort_unless($request->user()->can('template-gerenciar'), Response::HTTP_FORBIDDEN);

        $result = $this->sendMessageTemplateTestAction->executeForTenant(
            $messageTemplate,
            $request->user(),
            $request->channels(),
            $request->mergeData(),
        );

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'description' => 'Teste enfileirado para o seu usuário.',
            'result' => $result,
        ]);
    }
}
