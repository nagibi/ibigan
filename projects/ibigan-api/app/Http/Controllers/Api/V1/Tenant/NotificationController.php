<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Data\NotificationData;
use App\Events\NotificationsInvalidated;
use App\Events\NotificationStatusChanged;
use App\Http\Controllers\Controller;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class NotificationController extends Controller
{
    /**
     * Listar notificações do usuário autenticado.
     *
     * Requer permissão `notificacao-visualizar`.
     */
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('notificacao-visualizar'), Response::HTTP_FORBIDDEN);

        $notifications = $this->applyFilters(
            $request->user()->notifications(),
            $request,
        )
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
                    'unread' => $request->user()->unreadNotifications()->count(),
                ],
            ],
        ]);
    }

    /**
     * Marcar uma notificação como lida.
     */
    public function markAsRead(Request $request, string $notification): JsonResponse
    {
        abort_unless($request->user()->can('notificacao-visualizar'), Response::HTTP_FORBIDDEN);

        $databaseNotification = $request->user()
            ->notifications()
            ->where('id', $notification)
            ->firstOrFail();

        $databaseNotification->markAsRead();
        $result = NotificationData::fromModel($databaseNotification->fresh());

        broadcast(new NotificationStatusChanged($request->user()->id, $result));

        return response()->json([
            'status' => 1,
            'message' => 'MSG000425',
            'result' => $result,
        ]);
    }

    /**
     * Marcar uma notificação como não lida.
     */
    public function markAsUnread(Request $request, string $notification): JsonResponse
    {
        abort_unless($request->user()->can('notificacao-visualizar'), Response::HTTP_FORBIDDEN);

        $databaseNotification = $request->user()
            ->notifications()
            ->where('id', $notification)
            ->firstOrFail();

        $databaseNotification->forceFill(['read_at' => null])->save();
        $result = NotificationData::fromModel($databaseNotification->fresh());

        broadcast(new NotificationStatusChanged($request->user()->id, $result));

        return response()->json([
            'status' => 1,
            'message' => 'MSG000425',
            'result' => $result,
        ]);
    }

    /**
     * Marcar todas as notificações como lidas.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('notificacao-visualizar'), Response::HTTP_FORBIDDEN);

        $request->user()->unreadNotifications->markAsRead();

        broadcast(new NotificationsInvalidated($request->user()->id));

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
        abort_unless($request->user()->can('notificacao-visualizar'), Response::HTTP_FORBIDDEN);

        $request->user()
            ->notifications()
            ->where('id', $notification)
            ->delete();

        broadcast(new NotificationsInvalidated($request->user()->id));

        return response()->json([
            'status' => 1,
            'message' => 'MSG000426',
            'result' => null,
        ]);
    }

    /**
     * @param  Relation<\Illuminate\Notifications\DatabaseNotification, \App\Models\User, \Illuminate\Database\Eloquent\Collection<int, \Illuminate\Notifications\DatabaseNotification>>  $query
     * @return Relation<\Illuminate\Notifications\DatabaseNotification, \App\Models\User, \Illuminate\Database\Eloquent\Collection<int, \Illuminate\Notifications\DatabaseNotification>>
     */
    private function applyFilters(Relation $query, Request $request): Relation
    {
        if ($request->filled('search')) {
            $term = $request->string('search')->toString();
            $query->where(function (Builder $q) use ($term): void {
                $q->where('type', 'like', "%{$term}%")
                    ->orWhere('data', 'like', "%{$term}%");
            });
        }

        if ($request->filled('filter_id')) {
            $ids = array_values(array_filter(array_map(
                'trim',
                explode(',', $request->string('filter_id')->toString()),
            )));

            if ($ids !== []) {
                $query->whereIn('id', $ids);
            }
        }

        if ($request->filled('filter_title')) {
            $term = $request->string('filter_title')->toString();
            $query->where(function (Builder $q) use ($term): void {
                $q->where('type', 'like', "%{$term}%")
                    ->orWhere('data', 'like', "%{$term}%");
            });
        }

        if ($request->filled('filter_read_status')) {
            $status = $request->string('filter_read_status')->toString();

            if ($status === 'read') {
                $query->whereNotNull('read_at');
            } elseif ($status === 'unread') {
                $query->whereNull('read_at');
            }
        }

        if ($request->filled('filter_type') && $request->string('filter_type')->toString() === 'report') {
            $query->where(function (Builder $q): void {
                $q->where('type', 'like', '%ReportCompletedNotification%')
                    ->orWhere('data', 'like', '%"template_id"%');
            });
        }

        if ($request->filled('created_at_from')) {
            $query->whereDate('created_at', '>=', $request->string('created_at_from')->toString());
        }

        if ($request->filled('created_at_to')) {
            $query->whereDate('created_at', '<=', $request->string('created_at_to')->toString());
        }

        return $query;
    }
}
