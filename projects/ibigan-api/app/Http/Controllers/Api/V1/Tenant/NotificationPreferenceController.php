<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Services\NotificationPreferenceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

final class NotificationPreferenceController extends Controller
{
    public function __construct(
        private readonly NotificationPreferenceService $preferenceService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'result' => $this->preferenceService->getForUser($request->user()),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'event' => ['required', 'string', Rule::in(array_keys(NotificationPreferenceService::EVENTS))],
            'channel' => ['required', 'string', Rule::in(['email', 'app'])],
            'enabled' => ['required', 'boolean'],
        ]);

        $this->preferenceService->update(
            $request->user(),
            $validated['event'],
            $validated['channel'],
            $validated['enabled'],
        );

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'result' => $this->preferenceService->getForUser($request->user()),
        ]);
    }
}
