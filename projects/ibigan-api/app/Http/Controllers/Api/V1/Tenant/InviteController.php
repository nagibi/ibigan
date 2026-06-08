<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Actions\Invite\AcceptInviteAction;
use App\Actions\Invite\CreateInviteAction;
use App\Data\InviteData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Invite\AcceptInviteRequest;
use App\Http\Requests\Invite\StoreInviteRequest;
use App\Models\Invite;
use App\Repositories\Contracts\InviteRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class InviteController extends Controller
{
    public function __construct(
        private readonly InviteRepositoryInterface $inviteRepository,
        private readonly CreateInviteAction $createInviteAction,
        private readonly AcceptInviteAction $acceptInviteAction,
    ) {}

    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('usuario-visualizar'), Response::HTTP_FORBIDDEN);

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

    public function store(StoreInviteRequest $request): JsonResponse
    {
        abort_unless($request->user()->can('usuario-gerenciar'), Response::HTTP_FORBIDDEN);

        $invite = $this->createInviteAction->execute($request, $request->user());

        return response()->json([
            'status' => 1,
            'message' => 'MSG000424',
            'description' => 'Convite enviado com sucesso!',
            'result' => InviteData::fromModel($invite),
        ], Response::HTTP_CREATED);
    }

    public function destroy(Request $request, Invite $invite): JsonResponse
    {
        abort_unless($request->user()->can('usuario-gerenciar'), Response::HTTP_FORBIDDEN);

        $this->inviteRepository->delete($invite);

        return response()->json([
            'status' => 1,
            'message' => 'MSG000426',
            'result' => null,
        ]);
    }

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

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'description' => 'Convite aceito com sucesso!',
            'result' => $result,
        ]);
    }
}
