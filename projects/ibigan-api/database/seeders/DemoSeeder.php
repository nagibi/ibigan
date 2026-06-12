<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DemoSeeder extends Seeder
{
    /** @var array<int, array<string, mixed>> */
    private array $tenants = [
        [
            'id' => 'acme',
            'slug' => 'acme',
            'name' => 'Acme Corp',
            'cnpj' => '04252011000110',
            'timezone' => 'UTC',
            'locale' => 'pt_BR',
            'is_active' => true,
            'admin' => [
                'email' => 'super@ibigan.com',
                'name' => 'Super Admin',
                'cpf' => '39053344705',
                'phone' => '11987654321',
                'birth_date' => '1990-01-15',
                'gender' => 'prefer_not_to_say',
                'bio' => 'Usuário administrador da plataforma.',
                'password' => 'A12345',
                'status' => 'active',
                'is_super_admin' => true,
                'roles' => ['super-admin'],
            ],
        ],
    ];

    public function run(): void
    {
        // Super admin central
        DB::connection('central')->table('central_users')->updateOrInsert(
            ['email' => 'nagibi@gmail.com'],
            [
                'name'           => 'Nagibi Emanuel',
                'password'       => Hash::make('A12345'),
                'is_super_admin' => 1,
                'is_active'      => 1,
                'created_at'     => now(),
                'updated_at'     => now(),
            ]
        );
        $this->command->info('Super admin central criado: nagibi@gmail.com');

        foreach ($this->tenants as $tenantData) {
            $admin = $tenantData['admin'];
            unset($tenantData['admin']);

            $tenant = Tenant::updateOrCreate(
                ['id' => $tenantData['id']],
                $tenantData,
            );

            $tenant->run(function () use ($admin): void {
                $this->call(RolePermissionSeeder::class);
                $this->call(MenuSeeder::class);

                $roles = $admin['roles'] ?? ['admin'];
                unset($admin['roles']);

                $user = User::firstOrCreate(
                    ['email' => $admin['email']],
                    [
                        ...$admin,
                        'password' => Hash::make($admin['password']),
                    ],
                );

                $user->syncRoles($roles);
            });
        }
    }
}
