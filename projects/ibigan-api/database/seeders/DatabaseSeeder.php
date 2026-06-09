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
                    'password' => Hash::make('A12345'),
                    'status' => 'active',
                    'is_super_admin' => true,
                ]
            );

            $user->syncRoles(['super-admin']);
        });
    }
}
