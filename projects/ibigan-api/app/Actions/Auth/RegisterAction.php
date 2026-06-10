<?php

declare(strict_types=1);

namespace App\Actions\Auth;

use App\Http\Requests\Auth\RegisterRequest;
use App\Models\Central\TenantUser;
use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Str;

final class RegisterAction
{
    /**
     * @return array{token: string, tenant_id: string, user: array{id: int, name: string, email: string, roles: mixed, permissions: mixed}}
     */
    public function execute(RegisterRequest $request): array
    {
        $slug = Str::slug($request->validated('company_name'));
        $tenantId = $slug.'-'.Str::lower(Str::random(6));

        $tenant = Tenant::create([
            'id' => $tenantId,
            'slug' => $tenantId,
            'name' => $request->validated('company_name'),
        ]);

        $result = $tenant->run(function () use ($request, $tenant): array {
            (new RolePermissionSeeder)->run();

            $user = User::create([
                'name' => $request->validated('name'),
                'email' => $request->validated('email'),
                'password' => $request->validated('password'),
            ]);

            $user->assignRole('admin');

            $token = $user->createToken('api-token')->plainTextToken;

            return [
                'token' => $token,
                'tenant_id' => $tenant->id,
                'user_id' => $user->id,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'roles' => $user->getRoleNames(),
                    'permissions' => $user->getAllPermissions()->pluck('name'),
                ],
            ];
        });

        TenantUser::create([
            'tenant_id' => $tenant->id,
            'user_id' => $result['user_id'],
            'role' => 'admin',
            'is_default' => true,
            'joined_at' => now(),
        ]);

        unset($result['user_id']);

        return $result;
    }
}
