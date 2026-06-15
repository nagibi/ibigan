<?php

declare(strict_types=1);

namespace Database\Seeders\Concerns;

use App\Models\Central\TenantUser;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

trait SeedsPlatformTenantSuperAdmins
{
    /**
     * Super-admins da plataforma presentes em cada tenant.
     * IDs fixos permitem vínculos multi-empresa em tenant_users (mesmo user_id em todos os tenants).
     *
     * @return list<array{id: int, name: string, email: string, cpf: string}>
     */
    protected function platformTenantSuperAdmins(): array
    {
        return [
            [
                'id' => 9001,
                'name' => 'Hemily Monteiro',
                'email' => 'hemily.monteiro01@gmail.com',
                'cpf' => '86288358016',
            ],
            [
                'id' => 9002,
                'name' => 'Raphael Acunha da Silva',
                'email' => 'raphaelacunhadasilva@gmail.com',
                'cpf' => '15350946056',
            ],
            [
                'id' => 9003,
                'name' => 'Ibigan',
                'email' => 'ibigan@gmail.com',
                'cpf' => '61090473095',
            ],
        ];
    }

    /**
     * @return list<User>
     */
    protected function seedPlatformTenantSuperAdmins(string $tenantId, string $defaultTenantId): array
    {
        $users = [];

        foreach ($this->platformTenantSuperAdmins() as $admin) {
            $users[] = $this->upsertPlatformTenantSuperAdmin($admin);
        }

        $this->linkPlatformSuperAdminsToCentralTenant($tenantId, $users, $defaultTenantId);

        return $users;
    }

    /**
     * @param  array{id: int, name: string, email: string, cpf: string}  $admin
     */
    private function upsertPlatformTenantSuperAdmin(array $admin): User
    {
        $user = User::query()->where('email', $admin['email'])->first();

        if ($user === null) {
            $user = new User;
            $user->id = $admin['id'];
        }

        $isNew = ! $user->exists;

        $user->fill([
            'name' => $admin['name'],
            'email' => $admin['email'],
            'phone' => '11987654321',
            'birth_date' => '1990-01-15',
            'gender' => 'prefer_not_to_say',
            'bio' => 'Super-admin da plataforma no tenant.',
            'status' => 'active',
            'is_super_admin' => true,
            'is_active' => true,
        ]);

        if ($isNew) {
            $user->password = Hash::make('A12345');
        }

        $cpfAvailable = ! User::query()
            ->where('cpf', $admin['cpf'])
            ->when($user->exists, fn ($query) => $query->whereKeyNot($user->id))
            ->exists();

        if ($cpfAvailable || $user->cpf === $admin['cpf']) {
            $user->cpf = $admin['cpf'];
        }

        $user->save();
        $user->syncRoles(['super-admin']);

        return $user;
    }

    /**
     * @param  list<User>  $users
     */
    private function linkPlatformSuperAdminsToCentralTenant(
        string $tenantId,
        array $users,
        string $defaultTenantId,
    ): void {
        foreach ($users as $user) {
            TenantUser::query()->updateOrCreate(
                [
                    'tenant_id' => $tenantId,
                    'user_id' => $user->id,
                ],
                [
                    'role' => 'super-admin',
                    'is_default' => $tenantId === $defaultTenantId,
                    'joined_at' => now(),
                ],
            );
        }
    }
}
