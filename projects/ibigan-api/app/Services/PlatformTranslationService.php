<?php

declare(strict_types=1);

namespace App\Services;

use App\Data\TenantTranslationData;
use App\Models\Central\PlatformTranslation;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;

final class PlatformTranslationService
{
    /**
     * @return Collection<int, TenantTranslationData>
     */
    public function listManaged(Request $request, string $tenantId): Collection
    {
        $validated = $request->validate([
            'locale' => ['sometimes', 'string', Rule::in(['pt', 'en'])],
            'search' => ['sometimes', 'nullable', 'string', 'max:255'],
        ]);

        $query = PlatformTranslation::query()
            ->forTenant($tenantId)
            ->orderBy('key')
            ->orderBy('locale');

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

        return $query->get()->map(
            fn (PlatformTranslation $translation): TenantTranslationData => TenantTranslationData::fromModel($translation),
        );
    }

    /**
     * @return array<string, string>
     */
    public function overridesForTenant(string $tenantId, string $locale): array
    {
        return PlatformTranslation::query()
            ->forTenant($tenantId)
            ->active()
            ->forLocale($locale)
            ->orderBy('key')
            ->pluck('value', 'key')
            ->all();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function store(string $tenantId, array $data): TenantTranslationData
    {
        $translation = PlatformTranslation::query()->create([
            ...$data,
            'tenant_id' => $tenantId,
        ]);

        return TenantTranslationData::fromModel($translation);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(PlatformTranslation $translation, array $data): TenantTranslationData
    {
        $translation->update($data);

        return TenantTranslationData::fromModel($translation->fresh());
    }
}
