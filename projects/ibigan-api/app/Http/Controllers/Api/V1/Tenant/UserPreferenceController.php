<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Services\UserPreferenceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class UserPreferenceController extends Controller
{
    public function __construct(
        private readonly UserPreferenceService $preferenceService,
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
            'preferences' => ['required', 'array'],
            'preferences.*' => ['required', 'string', 'max:255'],
        ]);

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'result' => $this->preferenceService->upsertMany(
                $request->user(),
                $validated['preferences'],
            ),
        ]);
    }
}
