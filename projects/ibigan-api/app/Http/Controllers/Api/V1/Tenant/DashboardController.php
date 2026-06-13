<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Services\DashboardStatsService;
use App\Support\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class DashboardController extends Controller
{
    public function stats(Request $request, DashboardStatsService $dashboardStatsService): JsonResponse
    {
        $validated = $request->validate([
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
        ]);

        $includeCentralUsers = $request->user()->hasRole('super-admin')
            || (bool) $request->user()->getAttribute('is_super_admin');

        $dateFrom = isset($validated['date_from'])
            ? Carbon::parse($validated['date_from'])
            : null;

        $dateTo = isset($validated['date_to'])
            ? Carbon::parse($validated['date_to'])
            : null;

        return ApiResponse::success(
            $dashboardStatsService->forTenant($includeCentralUsers, $includeCentralUsers, $dateFrom, $dateTo),
            'MSG000067',
        );
    }
}
