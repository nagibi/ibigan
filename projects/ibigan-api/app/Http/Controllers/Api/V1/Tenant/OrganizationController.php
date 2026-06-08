<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Actions\Organization\CreateOrganizationAction;
use App\Actions\Organization\UpdateOrganizationAction;
use App\Data\OrganizationData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Organization\StoreOrganizationRequest;
use App\Http\Requests\Organization\UpdateOrganizationRequest;
use App\Jobs\ExportOrganizationsJob;
use App\Models\Organization;
use App\Repositories\Contracts\OrganizationRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class OrganizationController extends Controller
{
    public function __construct(
        private readonly OrganizationRepositoryInterface $organizationRepository,
        private readonly CreateOrganizationAction $createOrganizationAction,
        private readonly UpdateOrganizationAction $updateOrganizationAction,
    ) {}

    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('empresa-visualizar'), Response::HTTP_FORBIDDEN);

        $organizations = $this->organizationRepository->paginate(
            perPage: $request->integer('per_page', 15),
            filters: $request->only(['search', 'status']),
        );

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'result' => [
                'data' => OrganizationData::collect($organizations->items()),
                'meta' => [
                    'current_page' => $organizations->currentPage(),
                    'last_page' => $organizations->lastPage(),
                    'per_page' => $organizations->perPage(),
                    'total' => $organizations->total(),
                ],
            ],
        ]);
    }

    public function show(Request $request, int $organization): JsonResponse
    {
        abort_unless($request->user()->can('empresa-visualizar'), Response::HTTP_FORBIDDEN);

        $model = $this->organizationRepository->findOrFail($organization);

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'result' => OrganizationData::fromModel($model),
        ]);
    }

    public function store(StoreOrganizationRequest $request): JsonResponse
    {
        abort_unless($request->user()->can('empresa-gerenciar'), Response::HTTP_FORBIDDEN);

        $organization = $this->createOrganizationAction->execute($request);

        return response()->json([
            'status' => 1,
            'message' => 'MSG000424',
            'result' => OrganizationData::fromModel($organization),
        ], Response::HTTP_CREATED);
    }

    public function update(UpdateOrganizationRequest $request, Organization $organization): JsonResponse
    {
        abort_unless($request->user()->can('empresa-gerenciar'), Response::HTTP_FORBIDDEN);

        $updatedOrganization = $this->updateOrganizationAction->execute($organization, $request);

        return response()->json([
            'status' => 1,
            'message' => 'MSG000425',
            'result' => OrganizationData::fromModel($updatedOrganization),
        ]);
    }

    public function destroy(Request $request, Organization $organization): JsonResponse
    {
        abort_unless($request->user()->can('empresa-gerenciar'), Response::HTTP_FORBIDDEN);

        $this->organizationRepository->delete($organization);

        return response()->json([
            'status' => 1,
            'message' => 'MSG000426',
            'result' => null,
        ]);
    }

    public function export(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('empresa-gerenciar'), Response::HTTP_FORBIDDEN);

        ExportOrganizationsJob::dispatch($request->user()->id);

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'result' => [
                'message' => 'Exportação iniciada. Você receberá uma notificação quando estiver pronta.',
            ],
        ]);
    }

    public function uploadLogo(Request $request, int $organization): JsonResponse
    {
        abort_unless($request->user()->can('empresa-gerenciar'), Response::HTTP_FORBIDDEN);

        $request->validate([
            'logo' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        $organization = $this->organizationRepository->findOrFail($organization);

        $organization
            ->addMediaFromRequest('logo')
            ->toMediaCollection('logo');

        return response()->json([
            'status' => 1,
            'message' => 'MSG000425',
            'result' => OrganizationData::fromModel($organization->fresh()),
        ]);
    }
}
