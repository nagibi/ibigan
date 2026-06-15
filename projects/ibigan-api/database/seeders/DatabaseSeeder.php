<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(PlatformCatalogSeeder::class);

        $tenant = Tenant::updateOrCreate(
            ['id' => 'acme'],
            [
                'slug' => 'acme',
                'name' => 'Acme Corp',
                'cnpj' => '04252011000110',
                'timezone' => 'UTC',
                'locale' => 'pt_BR',
                'is_active' => true,
            ],
        );

        $tenant->domains()->updateOrCreate(
            ['domain' => 'acme.localhost'],
        );

        $tenant->run(function () {
            $this->call(RolePermissionSeeder::class);
            $this->call(MenuSeeder::class);

            $superAdmins = [
                [
                    'name' => 'Raphael Acunha da Silva',
                    'email' => 'raphaelacunhadasilva@gmail.com',
                    'cpf' => '39053344705',
                ],
                [
                    'name' => 'Hemily Monteiro',
                    'email' => 'hemily.monteiro01@gmail.com',
                    'cpf' => '86288358016',
                ],
                [
                    'name' => 'Ibigan',
                    'email' => 'ibigan@gmail.com',
                    'cpf' => '61090473095',
                ],
            ];

            $catalogSyncUser = null;

            foreach ($superAdmins as $admin) {
                $user = User::updateOrCreate(
                    ['email' => $admin['email']],
                    [
                        'name' => $admin['name'],
                        'cpf' => $admin['cpf'],
                        'phone' => '11987654321',
                        'birth_date' => '1990-01-15',
                        'gender' => 'prefer_not_to_say',
                        'bio' => 'Super-admin do tenant Acme.',
                        'password' => Hash::make('A12345'),
                        'status' => 'active',
                        'is_super_admin' => true,
                    ]
                );

                $user->syncRoles(['super-admin']);
                $catalogSyncUser ??= $user;
            }

            if ($catalogSyncUser !== null) {
                app(\App\Services\PlatformCatalogService::class)->sync($catalogSyncUser->id, force: true);
            }
        });
    }
}
