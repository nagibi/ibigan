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
        $tenant = Tenant::firstOrCreate(
            ['id' => 'acme'],
            ['slug' => 'acme']
        );

        $tenant->run(function () {
            $this->call(RolePermissionSeeder::class);
            $this->call(MenuSeeder::class);

            $user = User::firstOrCreate(
                ['email' => 'super@ibigan.com'],
                [
                    'name' => 'Super Admin',
                    'cpf' => '39053344705',
                    'phone' => '11987654321',
                    'birth_date' => '1990-01-15',
                    'gender' => 'prefer_not_to_say',
                    'bio' => 'Usuário administrador da plataforma.',
                    'password' => Hash::make('A12345'),
                    'status' => 'active',
                    'is_super_admin' => true,
                ]
            );

            $user->syncRoles(['super-admin']);
        });
    }
}
