<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Data\ActivityLogData;
use App\Http\Controllers\Controller;
use App\Repositories\Contracts\ActivityLogRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class ActivityLogController extends Controller
{
    public function __construct(
        private readonly ActivityLogRepositoryInterface $activityLogRepository,
    ) {}

    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('usuario-visualizar'), Response::HTTP_FORBIDDEN);

        $logs = $this->activityLogRepository->paginate(
            perPage: $request->integer('per_page', 15),
            filters: $request->only(['log_name', 'subject_type', 'causer_id', 'date_from', 'date_to']),
        );

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'result' => [
                'data' => ActivityLogData::collect($logs->items()),
                'meta' => [
                    'current_page' => $logs->currentPage(),
                    'last_page' => $logs->lastPage(),
                    'per_page' => $logs->perPage(),
                    'total' => $logs->total(),
                ],
            ],
        ]);
    }

    public function forSubject(Request $request, string $type, int $id): JsonResponse
    {
        abort_unless($request->user()->can('usuario-visualizar'), Response::HTTP_FORBIDDEN);

        $logs = $this->activityLogRepository->forSubject(
            type: $type,
            id: $id,
            perPage: $request->integer('per_page', 15),
        );

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'result' => [
                'data' => ActivityLogData::collect($logs->items()),
                'meta' => [
                    'current_page' => $logs->currentPage(),
                    'last_page' => $logs->lastPage(),
                    'per_page' => $logs->perPage(),
                    'total' => $logs->total(),
                ],
            ],
        ]);
    }
}
