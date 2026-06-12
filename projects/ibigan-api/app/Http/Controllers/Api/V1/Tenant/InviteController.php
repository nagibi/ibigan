<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Actions\Invite\AcceptInviteAction;
use App\Actions\Invite\CreateInviteAction;
use App\Data\InviteData;
use App\Enums\WebhookEvent;
use App\Http\Controllers\Controller;
use App\Http\Requests\Invite\AcceptInviteRequest;
use App\Http\Requests\Invite\StoreInviteRequest;
use App\Models\Invite;
use App\Repositories\Contracts\InviteRepositoryInterface;
use App\Services\WebhookDispatchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class InviteController extends Controller
{
    public function __construct(
        private readonly InviteRepositoryInterface $inviteRepository,
        private readonly CreateInviteAction $createInviteAction,
        private readonly AcceptInviteAction $acceptInviteAction,
        private readonly WebhookDispatchService $webhookDispatchService,
    ) {}

    /**
     * Listar convites paginados.
     *
     * Requer permissão `convite-visualizar`.
     */
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('convite-visualizar'), Response::HTTP_FORBIDDEN);

        $invites = $this->inviteRepository->paginate(
            perPage: $request->integer('per_page', 15),
            filters: $request->only(['search', 'status', 'role']),
        );

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'result' => [
                'data' => InviteData::collect($invites->items()),
                'meta' => [
                    'current_page' => $invites->currentPage(),
                    'last_page' => $invites->lastPage(),
                    'per_page' => $invites->perPage(),
                    'total' => $invites->total(),
                ],
            ],
        ]);
    }

    /**
     * Criar convite e enfileirar e-mail de convite.
     *
     * Requer permissão `convite-gerenciar`.
     */
    public function store(StoreInviteRequest $request): JsonResponse
    {
        abort_unless($request->user()->can('convite-gerenciar'), Response::HTTP_FORBIDDEN);

        $invite = $this->createInviteAction->execute($request, $request->user());

        return response()->json([
            'status' => 1,
            'message' => 'MSG000424',
            'description' => 'Convite enviado com sucesso!',
            'result' => InviteData::fromModel($invite),
        ], Response::HTTP_CREATED);
    }

    /**
     * Cancelar convite pendente.
     *
     * Requer permissão `convite-gerenciar`.
     */
    public function destroy(Request $request, Invite $invite): JsonResponse
    {
        abort_unless($request->user()->can('convite-gerenciar'), Response::HTTP_FORBIDDEN);

        $this->inviteRepository->delete($invite);

        return response()->json([
            'status' => 1,
            'message' => 'MSG000426',
            'result' => null,
        ]);
    }

    /**
     * Aceitar convite e criar usuário no tenant.
     *
     * Rota pública. Requer header `X-Tenant-ID` e token do convite.
     */
    public function accept(AcceptInviteRequest $request): JsonResponse
    {
        $tenantId = $request->header('X-Tenant-ID');

        if (! $tenantId || ! tenant()) {
            return response()->json([
                'status' => 0,
                'message' => 'MSG000067',
                'description' => 'Tenant não informado.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $result = $this->acceptInviteAction->execute($request, $tenantId);

        $this->webhookDispatchService->dispatch(
            WebhookEvent::InviteAccepted->value,
            [
                'token' => $request->validated('token'),
                'user' => $result['user'],
            ],
        );

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'description' => 'Convite aceito com sucesso!',
            'result' => $result,
        ]);
    }
}
