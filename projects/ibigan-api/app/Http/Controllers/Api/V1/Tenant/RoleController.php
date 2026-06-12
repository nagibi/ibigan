<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Data\RoleData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Role\StoreRoleRequest;
use App\Http\Requests\Role\SyncRolePermissionsRequest;
use App\Http\Requests\Role\UpdateRoleRequest;
use App\Support\SystemRoles;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;
use Symfony\Component\HttpFoundation\Response;

final class RoleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('permissao-visualizar'), Response::HTTP_FORBIDDEN);

        $roles = Role::query()
            ->where('guard_name', 'sanctum')
            ->with('permissions')
            ->orderBy('name')
            ->get();

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'result' => RoleData::collect($roles),
        ]);
    }

    public function show(Request $request, Role $role): JsonResponse
    {
        abort_unless($request->user()->can('permissao-visualizar'), Response::HTTP_FORBIDDEN);
        $this->ensureSanctumRole($role);

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'result' => RoleData::fromModel($role),
        ]);
    }

    public function store(StoreRoleRequest $request): JsonResponse
    {
        abort_unless($request->user()->can('permissao-gerenciar'), Response::HTTP_FORBIDDEN);

        $role = Role::query()->create([
            'name' => $request->validated('name'),
            'guard_name' => 'sanctum',
        ]);

        if ($request->filled('permissions')) {
            $role->syncPermissions($request->validated('permissions'));
        }

        return response()->json([
            'status' => 1,
            'message' => 'MSG000424',
            'result' => RoleData::fromModel($role->fresh('permissions')),
        ], Response::HTTP_CREATED);
    }

    public function update(UpdateRoleRequest $request, Role $role): JsonResponse
    {
        abort_unless($request->user()->can('permissao-gerenciar'), Response::HTTP_FORBIDDEN);
        $this->ensureSanctumRole($role);

        if (SystemRoles::isSystem($role->name)) {
            abort(Response::HTTP_UNPROCESSABLE_ENTITY, 'Papéis do sistema não podem ser renomeados.');
        }

        $role->update(['name' => $request->validated('name')]);

        return response()->json([
            'status' => 1,
            'message' => 'MSG000425',
            'result' => RoleData::fromModel($role->fresh('permissions')),
        ]);
    }

    public function syncPermissions(SyncRolePermissionsRequest $request, Role $role): JsonResponse
    {
        abort_unless($request->user()->can('permissao-gerenciar'), Response::HTTP_FORBIDDEN);
        $this->ensureSanctumRole($role);

        if (SystemRoles::permissionsAreLocked($role->name)) {
            abort(Response::HTTP_UNPROCESSABLE_ENTITY, 'As permissões deste papel não podem ser alteradas.');
        }

        $role->syncPermissions($request->validated('permissions'));

        return response()->json([
            'status' => 1,
            'message' => 'MSG000425',
            'result' => RoleData::fromModel($role->fresh('permissions')),
        ]);
    }

    public function destroy(Request $request, Role $role): JsonResponse
    {
        abort_unless($request->user()->can('permissao-gerenciar'), Response::HTTP_FORBIDDEN);
        $this->ensureSanctumRole($role);

        if (SystemRoles::isSystem($role->name)) {
            abort(Response::HTTP_UNPROCESSABLE_ENTITY, 'Papéis do sistema não podem ser removidos.');
        }

        if ($role->users()->exists()) {
            abort(Response::HTTP_UNPROCESSABLE_ENTITY, 'Não é possível remover um papel com usuários vinculados.');
        }

        $role->delete();

        return response()->json([
            'status' => 1,
            'message' => 'MSG000426',
            'result' => null,
        ]);
    }

    private function ensureSanctumRole(Role $role): void
    {
        abort_unless($role->guard_name === 'sanctum', Response::HTTP_NOT_FOUND);
    }
}
