<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Search\GlobalSearchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class GlobalSearchController extends Controller
{
    public function __construct(private GlobalSearchService $search) {}

    public function __invoke(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'q' => ['required', 'string', 'min:2', 'max:120'],
        ]);

        $groups = $this->search->search(
            $validated['q'],
            $request->user(),
        );

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'result' => $groups,
        ]);
    }
}
