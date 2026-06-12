<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Data\TenantTranslationData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Translation\StoreTranslationRequest;
use App\Http\Requests\Translation\UpdateTranslationRequest;
use App\Models\TenantTranslation;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response;

final class TranslationController extends Controller
{
    /**
     * Sobrescritas customizadas do tenant (mescladas sobre o JSON local do front).
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'locale' => ['sometimes', 'string', Rule::in(['pt', 'en'])],
        ]);

        $locale = $validated['locale'] ?? 'pt';

        $overrides = TenantTranslation::query()
            ->active()
            ->forLocale($locale)
            ->orderBy('key')
            ->pluck('value', 'key')
            ->all();

        return ApiResponse::success([
            'locale' => $locale,
            'overrides' => $overrides === [] ? (object) [] : $overrides,
        ]);
    }

    public function manage(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('configuracao-gerenciar'), Response::HTTP_FORBIDDEN);

        $validated = $request->validate([
            'locale' => ['sometimes', 'string', Rule::in(['pt', 'en'])],
            'search' => ['sometimes', 'nullable', 'string', 'max:255'],
        ]);

        $query = TenantTranslation::query()->orderBy('key')->orderBy('locale');

        if (! empty($validated['locale'])) {
            $query->forLocale($validated['locale']);
        }

        if (! empty($validated['search'])) {
            $search = $validated['search'];
            $query->where(function ($builder) use ($search): void {
                $builder
                    ->where('key', 'like', "%{$search}%")
                    ->orWhere('value', 'like', "%{$search}%");
            });
        }

        $items = $query->get()->map(
            fn (TenantTranslation $translation): TenantTranslationData => TenantTranslationData::fromModel($translation),
        );

        return ApiResponse::success($items);
    }

    public function store(StoreTranslationRequest $request): JsonResponse
    {
        abort_unless($request->user()->can('configuracao-gerenciar'), Response::HTTP_FORBIDDEN);

        $translation = TenantTranslation::query()->create($request->validated());

        return ApiResponse::success(
            TenantTranslationData::fromModel($translation),
            'translation.created_successfully',
            severity: 'success',
            httpStatus: Response::HTTP_CREATED,
        );
    }

    public function update(UpdateTranslationRequest $request, TenantTranslation $translation): JsonResponse
    {
        abort_unless($request->user()->can('configuracao-gerenciar'), Response::HTTP_FORBIDDEN);

        $translation->update($request->validated());

        return ApiResponse::success(
            TenantTranslationData::fromModel($translation->fresh()),
            'translation.updated_successfully',
            severity: 'success',
        );
    }
}
