<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Data\NotificationData;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class NotificationController extends Controller
{
    /**
     * Listar notificações do usuário autenticado.
     *
     * Requer permissão `usuario-visualizar`.
     */
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('usuario-visualizar'), Response::HTTP_FORBIDDEN);

        $notifications = $request->user()
            ->notifications()
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'result' => [
                'data' => NotificationData::collect($notifications->items()),
                'meta' => [
                    'current_page' => $notifications->currentPage(),
                    'last_page' => $notifications->lastPage(),
                    'per_page' => $notifications->perPage(),
                    'total' => $notifications->total(),
                ],
            ],
        ]);
    }

    /**
     * Marcar uma notificação como lida.
     */
    public function markAsRead(Request $request, string $notification): JsonResponse
    {
        abort_unless($request->user()->can('usuario-visualizar'), Response::HTTP_FORBIDDEN);

        $databaseNotification = $request->user()
            ->notifications()
            ->where('id', $notification)
            ->firstOrFail();

        $databaseNotification->markAsRead();

        return response()->json([
            'status' => 1,
            'message' => 'MSG000425',
            'result' => NotificationData::fromModel($databaseNotification->fresh()),
        ]);
    }

    /**
     * Marcar todas as notificações como lidas.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('usuario-visualizar'), Response::HTTP_FORBIDDEN);

        $request->user()->unreadNotifications->markAsRead();

        return response()->json([
            'status' => 1,
            'message' => 'MSG000425',
            'result' => null,
        ]);
    }

    /**
     * Remover uma notificação.
     */
    public function destroy(Request $request, string $notification): JsonResponse
    {
        abort_unless($request->user()->can('usuario-visualizar'), Response::HTTP_FORBIDDEN);

        $request->user()
            ->notifications()
            ->where('id', $notification)
            ->delete();

        return response()->json([
            'status' => 1,
            'message' => 'MSG000426',
            'result' => null,
        ]);
    }
}
