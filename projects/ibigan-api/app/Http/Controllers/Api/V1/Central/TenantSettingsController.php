<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Central;

use App\Data\TenantSettingsData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\UpdateTenantSettingsRequest;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

final class TenantSettingsController extends Controller
{
    /**
     * Retornar configurações do tenant atual.
     */
    public function show(Request $request): JsonResponse
    {
        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'result' => TenantSettingsData::fromModel($this->currentTenant()),
        ]);
    }

    /**
     * Atualizar configurações do tenant (nome, timezone, locale).
     *
     * Requer role admin ou super-admin.
     */
    public function update(UpdateTenantSettingsRequest $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $tenant = $this->currentTenant();
        $tenant->update($request->validated());

        return response()->json([
            'status' => 1,
            'message' => 'MSG000425',
            'result' => TenantSettingsData::fromModel($tenant->fresh()),
        ]);
    }

    /**
     * Fazer upload do logo do tenant.
     */
    public function uploadLogo(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $request->validate([
            'logo' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        $tenant = $this->currentTenant();
        $this->deleteStoredLogo($tenant);

        $path = $request->file('logo')->store('logos', 'public');
        $tenant->update([
            'logo_url' => Storage::disk('public')->url($path),
        ]);

        return response()->json([
            'status' => 1,
            'message' => 'MSG000425',
            'result' => TenantSettingsData::fromModel($tenant->fresh()),
        ]);
    }

    /**
     * Remover logo do tenant.
     */
    public function deleteLogo(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $tenant = $this->currentTenant();
        $this->deleteStoredLogo($tenant);
        $tenant->update(['logo_url' => null]);

        return response()->json([
            'status' => 1,
            'message' => 'MSG000426',
            'result' => null,
        ]);
    }

    private function currentTenant(): Tenant
    {
        /** @var Tenant $tenant */
        $tenant = tenant();

        return $tenant;
    }

    private function deleteStoredLogo(Tenant $tenant): void
    {
        $logoUrl = $tenant->logo_url;

        if (! $logoUrl) {
            return;
        }

        $baseUrl = Storage::disk('public')->url('');
        $relativePath = ltrim(str_replace($baseUrl, '', $logoUrl), '/');

        if ($relativePath !== '' && Storage::disk('public')->exists($relativePath)) {
            Storage::disk('public')->delete($relativePath);
        }
    }

    private function ensureAdmin(Request $request): void
    {
        abort_unless(
            $request->user()->hasAnyRole(['admin', 'super-admin']),
            Response::HTTP_FORBIDDEN
        );
    }
}
