<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Data\PermissionData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Permission\StorePermissionRequest;
use App\Http\Requests\Permission\UpdatePermissionRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;
use Symfony\Component\HttpFoundation\Response;

final class PermissionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('permissao-visualizar'), Response::HTTP_FORBIDDEN);

        $permissions = Permission::query()
            ->where('guard_name', 'sanctum')
            ->orderBy('name')
            ->get();

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'result' => PermissionData::collect($permissions),
        ]);
    }

    public function show(Request $request, Permission $permission): JsonResponse
    {
        abort_unless($request->user()->can('permissao-visualizar'), Response::HTTP_FORBIDDEN);
        $this->ensureSanctumPermission($permission);

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'result' => PermissionData::fromModel($permission),
        ]);
    }

    public function store(StorePermissionRequest $request): JsonResponse
    {
        abort_unless($request->user()->can('permissao-gerenciar'), Response::HTTP_FORBIDDEN);

        $permission = Permission::query()->create([
            'name' => $request->validated('name'),
            'guard_name' => 'sanctum',
        ]);

        return response()->json([
            'status' => 1,
            'message' => 'MSG000424',
            'result' => PermissionData::fromModel($permission),
        ], Response::HTTP_CREATED);
    }

    public function update(UpdatePermissionRequest $request, Permission $permission): JsonResponse
    {
        abort_unless($request->user()->can('permissao-gerenciar'), Response::HTTP_FORBIDDEN);
        $this->ensureSanctumPermission($permission);

        $permission->update(['name' => $request->validated('name')]);

        return response()->json([
            'status' => 1,
            'message' => 'MSG000425',
            'result' => PermissionData::fromModel($permission->fresh()),
        ]);
    }

    public function destroy(Request $request, Permission $permission): JsonResponse
    {
        abort_unless($request->user()->can('permissao-gerenciar'), Response::HTTP_FORBIDDEN);
        $this->ensureSanctumPermission($permission);

        if ($permission->roles()->exists()) {
            abort(Response::HTTP_UNPROCESSABLE_ENTITY, 'Não é possível remover uma permissão vinculada a papéis.');
        }

        $permission->delete();

        return response()->json([
            'status' => 1,
            'message' => 'MSG000426',
            'result' => null,
        ]);
    }

    private function ensureSanctumPermission(Permission $permission): void
    {
        abort_unless($permission->guard_name === 'sanctum', Response::HTTP_NOT_FOUND);
    }
}
