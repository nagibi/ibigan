<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Central;

use App\Data\Central\PlatformReportTemplateData;
use App\Http\Controllers\Controller;
use App\Http\Requests\ToggleActiveRequest;
use App\Models\Central\CentralUser;
use App\Models\Central\PlatformReportTemplate;
use App\Services\PlatformCatalogService;
use App\Services\ReportService;
use App\Support\GridFilter;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class PlatformReportTemplateController extends Controller
{
    public function __construct(
        private readonly PlatformCatalogService $platformCatalogService,
        private readonly ReportService $reportService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorizeSuperAdmin($request);

        $templates = PlatformReportTemplate::query()
            ->when($request->filled('search'), function (Builder $query) use ($request): void {
                $term = $request->string('search')->toString();
                $query->where(function (Builder $builder) use ($term): void {
                    $builder->where('name', 'like', "%{$term}%")
                        ->orWhere('description', 'like', "%{$term}%")
                        ->orWhere('platform_key', 'like', "%{$term}%");
                });
            })
            ->when(
                $request->filled('filter_id'),
                fn (Builder $query) => GridFilter::applyIdFromCsv($query, $request->string('filter_id')->toString()),
            )
            ->when(
                $request->filled('filter_name'),
                fn (Builder $query) => $query->where('name', 'like', '%'.$request->string('filter_name')->toString().'%'),
            )
            ->when(
                $request->filled('filter_description'),
                fn (Builder $query) => $query->where('description', 'like', '%'.$request->string('filter_description')->toString().'%'),
            )
            ->when($request->has('is_active'), fn (Builder $query) => $query->where('is_active', $request->boolean('is_active')))
            ->when(
                filled($request->input('filter_status')),
                fn (Builder $query) => GridFilter::applyWhereInFromCsv(
                    $query,
                    'is_active',
                    collect(GridFilter::csvValues($request->string('filter_status')->toString()))
                        ->map(static fn (string $value): string => $value === 'active' ? '1' : '0')
                        ->implode(','),
                ),
            )
            ->orderBy('name')
            ->paginate($request->integer('per_page', 15));

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'result' => [
                'data' => PlatformReportTemplateData::collect($templates->items()),
                'meta' => [
                    'current_page' => $templates->currentPage(),
                    'last_page' => $templates->lastPage(),
                    'per_page' => $templates->perPage(),
                    'total' => $templates->total(),
                ],
            ],
        ]);
    }

    public function show(Request $request, PlatformReportTemplate $reportTemplate): JsonResponse
    {
        $this->authorizeSuperAdmin($request);

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'result' => PlatformReportTemplateData::fromModel($reportTemplate),
        ]);
    }

    public function update(Request $request, PlatformReportTemplate $reportTemplate): JsonResponse
    {
        $this->authorizeSuperAdmin($request);

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'query' => ['sometimes', 'required', 'string'],
            'parameters' => ['nullable', 'array'],
            'columns' => ['nullable', 'array'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        if (isset($validated['query'])) {
            $this->reportService->validateQueryForTemplate($validated['query']);
        }

        $templateId = $reportTemplate->getKey();
        $reportTemplate->update($validated);

        $result = PlatformReportTemplateData::fromModel(
            PlatformReportTemplate::query()->findOrFail($templateId),
        );

        $this->platformCatalogService->syncAllTenants(force: true);

        return response()->json([
            'status' => 1,
            'message' => 'MSG000425',
            'result' => $result,
        ]);
    }

    public function toggleActive(ToggleActiveRequest $request, PlatformReportTemplate $platformReportTemplate): JsonResponse
    {
        $this->authorizeSuperAdmin($request);

        $templateId = $platformReportTemplate->getKey();
        $platformReportTemplate->update(['is_active' => $request->boolean('is_active')]);

        $result = PlatformReportTemplateData::fromModel(
            PlatformReportTemplate::query()->findOrFail($templateId),
        );

        $this->platformCatalogService->syncAllTenants(force: true);

        return response()->json([
            'status' => 1,
            'message' => 'MSG000425',
            'result' => $result,
        ]);
    }

    private function authorizeSuperAdmin(Request $request): void
    {
        abort_unless(
            $request->user() instanceof CentralUser && $request->user()->is_super_admin,
            Response::HTTP_FORBIDDEN,
        );
    }
}
