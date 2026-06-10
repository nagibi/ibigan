<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Central;

use App\Data\ActivityLogData;
use App\Http\Controllers\Controller;
use App\Models\Central\CentralUser;
use App\Models\Tenant;
use App\Rules\Cnpj;
use App\Support\BrazilianDocuments;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Spatie\Activitylog\Models\Activity;
use Symfony\Component\HttpFoundation\Response;

/**
 * CRUD de tenants no escopo SaaS.
 *
 * Rotas: /api/central/v1/admin/tenants — somente super-admin (ver docs/ROUTING.md).
 * No frontend o recurso é exibido como "Empresa".
 */
final class TenantAdminController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin($request);

        $sort = $request->string('sort', 'created_at')->toString();
        $allowedSorts = ['id', 'name', 'cnpj', 'is_active', 'users_count', 'created_at', 'updated_at'];
        if (! in_array($sort, $allowedSorts, true)) {
            $sort = 'created_at';
        }

        $direction = $request->string('direction', 'desc')->toString() === 'asc' ? 'asc' : 'desc';

        $tenants = Tenant::query()
            ->withCount('tenantUsers as users_count')
            ->when($request->filled('search'), function ($query) use ($request): void {
                $search = $request->string('search')->toString();
                $digits = BrazilianDocuments::digitsOnly($search);

                $query->where(function ($builder) use ($search, $digits): void {
                    $builder->where('name', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%")
                        ->orWhere('id', 'like', "%{$search}%");

                    if ($digits !== null && $digits !== '') {
                        $builder->orWhere('cnpj', 'like', "%{$digits}%");
                    }
                });
            })
            ->when($request->filled('filter_id'), function ($query) use ($request): void {
                $query->where('id', 'like', '%' . $request->string('filter_id')->toString() . '%');
            })
            ->when($request->filled('filter_name'), function ($query) use ($request): void {
                $query->where('name', 'like', '%' . $request->string('filter_name')->toString() . '%');
            })
            ->when($request->filled('filter_cnpj'), function ($query) use ($request): void {
                $digits = BrazilianDocuments::digitsOnly($request->string('filter_cnpj')->toString()) ?? '';
                if ($digits !== '') {
                    $query->where('cnpj', 'like', "%{$digits}%");
                }
            })
            ->when($request->has('filter_is_active'), function ($query) use ($request): void {
                $query->where('is_active', $request->boolean('filter_is_active'));
            })
            ->when($request->filled('filter_created_at_from'), function ($query) use ($request): void {
                $query->whereDate('created_at', '>=', $request->string('filter_created_at_from')->toString());
            })
            ->when($request->filled('filter_created_at_to'), function ($query) use ($request): void {
                $query->whereDate('created_at', '<=', $request->string('filter_created_at_to')->toString());
            })
            ->when($request->filled('filter_updated_at_from'), function ($query) use ($request): void {
                $query->whereDate('updated_at', '>=', $request->string('filter_updated_at_from')->toString());
            })
            ->when($request->filled('filter_updated_at_to'), function ($query) use ($request): void {
                $query->whereDate('updated_at', '<=', $request->string('filter_updated_at_to')->toString());
            })
            ->orderBy($sort, $direction)
            ->paginate($request->integer('per_page', 15));

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'result' => [
                'data' => $tenants->map(fn(Tenant $tenant) => $this->formatTenant($tenant)),
                'meta' => [
                    'total' => $tenants->total(),
                    'current_page' => $tenants->currentPage(),
                    'last_page' => $tenants->lastPage(),
                    'per_page' => $tenants->perPage(),
                ],
            ],
        ]);
    }

    public function show(Request $request, string $tenant): JsonResponse
    {
        $this->ensureSuperAdmin($request);

        $model = Tenant::query()
            ->withCount('tenantUsers as users_count')
            ->findOrFail($tenant);

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'result' => $this->formatTenant($model),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin($request);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'cnpj' => ['nullable', 'string', 'max:18', new Cnpj, Rule::unique(Tenant::class, 'cnpj')],
            'timezone' => ['nullable', 'string'],
            'locale' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $slug = Str::slug($validated['name']);
        $tenantId = $slug . '-' . Str::lower(Str::random(6));

        $tenant = Tenant::create([
            'id' => $tenantId,
            'slug' => $tenantId,
            'name' => $validated['name'],
            'cnpj' => $this->normalizeCnpj($validated['cnpj'] ?? null),
            'timezone' => $validated['timezone'] ?? 'UTC',
            'locale' => $validated['locale'] ?? 'pt_BR',
            'is_active' => $validated['is_active'] ?? true,
        ]);

        $tenant->run(fn() => (new RolePermissionSeeder)->run());

        return response()->json([
            'status' => 1,
            'message' => 'MSG000424',
            'result' => $this->formatTenant($tenant),
        ], Response::HTTP_CREATED);
    }

    public function update(Request $request, string $tenant): JsonResponse
    {
        $this->ensureSuperAdmin($request);

        $model = Tenant::findOrFail($tenant);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'cnpj' => ['sometimes', 'nullable', 'string', 'max:18', new Cnpj, Rule::unique(Tenant::class, 'cnpj')->ignore($model->id, 'id')],
            'timezone' => ['sometimes', 'string'],
            'locale' => ['sometimes', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        if (array_key_exists('cnpj', $validated)) {
            $validated['cnpj'] = $this->normalizeCnpj($validated['cnpj']);
        }

        $model->update($validated);

        return response()->json([
            'status' => 1,
            'message' => 'MSG000425',
            'result' => $this->formatTenant($model->fresh()),
        ]);
    }

    public function toggleActive(Request $request, string $tenant): JsonResponse
    {
        $this->ensureSuperAdmin($request);

        $validated = $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        $model = Tenant::findOrFail($tenant);
        $model->update(['is_active' => $validated['is_active']]);

        return response()->json([
            'status' => 1,
            'message' => 'MSG000425',
            'result' => $this->formatTenant($model->fresh()),
        ]);
    }

    public function activityLogs(Request $request, string $tenant): JsonResponse
    {
        $this->ensureSuperAdmin($request);

        $model = Tenant::findOrFail($tenant);

        $logs = $model->run(function () use ($request) {
            return Activity::query()
                ->with(['causer'])
                ->latest()
                ->paginate($request->integer('per_page', 50));
        });

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'result' => [
                'data' => ActivityLogData::collect($logs->items()),
                'meta' => [
                    'current_page' => $logs->currentPage(),
                    'last_page' => $logs->lastPage(),
                    'per_page' => $logs->perPage(),
                    'total' => $logs->total(),
                ],
            ],
        ]);
    }

    public function destroy(Request $request, string $tenant): JsonResponse
    {
        $this->ensureSuperAdmin($request);

        $model = Tenant::findOrFail($tenant);
        $model->delete();

        return response()->json([
            'status' => 1,
            'message' => 'MSG000426',
            'result' => null,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function formatTenant(Tenant $tenant): array
    {
        return [
            'id' => $tenant->id,
            'name' => $tenant->name,
            'slug' => $tenant->slug,
            'cnpj' => $tenant->cnpj,
            'timezone' => $tenant->timezone,
            'locale' => $tenant->locale,
            'is_active' => (bool) $tenant->is_active,
            'users_count' => (int) ($tenant->users_count ?? 0),
            'created_at' => $tenant->created_at?->toIso8601String(),
            'updated_at' => $tenant->updated_at?->toIso8601String(),
        ];
    }

    private function normalizeCnpj(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        return BrazilianDocuments::digitsOnly($value);
    }

    private function ensureSuperAdmin(Request $request): void
    {
        abort_unless(
            $request->user() instanceof CentralUser && $request->user()->is_super_admin,
            Response::HTTP_FORBIDDEN
        );
    }
}
