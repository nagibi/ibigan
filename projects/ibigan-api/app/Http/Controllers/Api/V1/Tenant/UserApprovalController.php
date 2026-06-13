<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\UserApproval;
use App\Notifications\UserApprovedNotification;
use App\Notifications\UserRejectedNotification;
use App\Support\GridFilter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class UserApprovalController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('aprovacao-visualizar'), Response::HTTP_FORBIDDEN);

        $statuses = GridFilter::csvValues($request->query('status', 'pending'));

        $approvals = UserApproval::with('user')
            ->when(
                $statuses !== [],
                fn ($query) => count($statuses) === 1
                    ? $query->where('status', $statuses[0])
                    : $query->whereIn('status', $statuses),
            )
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 15));

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'result' => [
                'data' => $approvals->map(fn ($a) => [
                    'id' => $a->id,
                    'user_id' => $a->user_id,
                    'user_name' => $a->user?->name,
                    'user_email' => $a->user?->email,
                    'status' => $a->status,
                    'reviewed_by' => $a->reviewed_by,
                    'reviewed_at' => $a->reviewed_at?->toIso8601String(),
                    'rejection_reason' => $a->rejection_reason,
                    'created_at' => $a->created_at->toIso8601String(),
                ]),
                'meta' => [
                    'total' => $approvals->total(),
                    'current_page' => $approvals->currentPage(),
                    'last_page' => $approvals->lastPage(),
                    'per_page' => $approvals->perPage(),
                ],
            ],
        ]);
    }

    public function approve(Request $request, UserApproval $userApproval): JsonResponse
    {
        abort_unless($request->user()->can('aprovacao-gerenciar'), Response::HTTP_FORBIDDEN);
        abort_if($userApproval->isApproved(), Response::HTTP_UNPROCESSABLE_ENTITY);

        $userApproval->update([
            'status' => 'approved',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        $userApproval->user->update(['is_active' => true]);

        $userApproval->user->notify(new UserApprovedNotification());

        return response()->json([
            'status' => 1,
            'message' => 'MSG000425',
            'result' => null,
        ]);
    }

    public function reject(Request $request, UserApproval $userApproval): JsonResponse
    {
        abort_unless($request->user()->can('aprovacao-gerenciar'), Response::HTTP_FORBIDDEN);
        abort_if($userApproval->isRejected(), Response::HTTP_UNPROCESSABLE_ENTITY);

        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $userApproval->update([
            'status' => 'rejected',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'rejection_reason' => $validated['reason'] ?? null,
        ]);

        $userApproval->user->update(['is_active' => false]);

        $userApproval->user->notify(new UserRejectedNotification($validated['reason'] ?? null));

        return response()->json([
            'status' => 1,
            'message' => 'MSG000425',
            'result' => null,
        ]);
    }
}
