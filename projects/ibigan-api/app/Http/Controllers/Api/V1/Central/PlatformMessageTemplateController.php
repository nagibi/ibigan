<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Central;

use App\Data\Central\PlatformMessageTemplateData;
use App\Http\Controllers\Controller;
use App\Http\Requests\ToggleActiveRequest;
use App\Models\Central\CentralUser;
use App\Models\Central\PlatformMessageTemplate;
use App\Services\PlatformCatalogService;
use App\Support\GridFilter;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class PlatformMessageTemplateController extends Controller
{
    public function __construct(
        private readonly PlatformCatalogService $platformCatalogService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorizeSuperAdmin($request);

        $templates = PlatformMessageTemplate::query()
            ->when($request->filled('search'), function (Builder $query) use ($request): void {
                $term = $request->string('search')->toString();
                $query->where(function (Builder $builder) use ($term): void {
                    $builder->where('name', 'like', "%{$term}%")
                        ->orWhere('slug', 'like', "%{$term}%")
                        ->orWhere('subject', 'like', "%{$term}%");
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
                $request->filled('filter_slug'),
                fn (Builder $query) => $query->where('slug', 'like', '%'.$request->string('filter_slug')->toString().'%'),
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
                'data' => PlatformMessageTemplateData::collect($templates->items()),
                'meta' => [
                    'current_page' => $templates->currentPage(),
                    'last_page' => $templates->lastPage(),
                    'per_page' => $templates->perPage(),
                    'total' => $templates->total(),
                ],
            ],
        ]);
    }

    public function show(Request $request, PlatformMessageTemplate $messageTemplate): JsonResponse
    {
        $this->authorizeSuperAdmin($request);

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'result' => PlatformMessageTemplateData::fromModel($messageTemplate),
        ]);
    }

    public function update(Request $request, PlatformMessageTemplate $messageTemplate): JsonResponse
    {
        $this->authorizeSuperAdmin($request);

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'subject' => ['sometimes', 'required', 'string', 'max:255'],
            'body' => ['sometimes', 'required', 'string'],
            'merge_tags' => ['nullable', 'array'],
            'merge_tags.*' => ['string'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $templateId = $messageTemplate->getKey();
        $messageTemplate->update($validated);

        $result = PlatformMessageTemplateData::fromModel(
            PlatformMessageTemplate::query()->findOrFail($templateId),
        );

        $this->platformCatalogService->syncAllTenants(force: true);

        return response()->json([
            'status' => 1,
            'message' => 'MSG000425',
            'result' => $result,
        ]);
    }

    public function toggleActive(ToggleActiveRequest $request, PlatformMessageTemplate $platformMessageTemplate): JsonResponse
    {
        $this->authorizeSuperAdmin($request);

        $templateId = $platformMessageTemplate->getKey();
        $platformMessageTemplate->update(['is_active' => $request->boolean('is_active')]);

        $result = PlatformMessageTemplateData::fromModel(
            PlatformMessageTemplate::query()->findOrFail($templateId),
        );

        $this->platformCatalogService->syncAllTenants(force: true);

        return response()->json([
            'status' => 1,
            'message' => 'MSG000425',
            'result' => $result,
        ]);
    }

    public function sync(Request $request): JsonResponse
    {
        $this->authorizeSuperAdmin($request);

        $processed = $this->platformCatalogService->syncAllTenants(force: true);

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'result' => ['tenants_synced' => $processed],
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
