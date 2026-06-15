<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Central\CentralUser;
use Illuminate\Database\Seeder;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(PlatformCatalogSeeder::class);

        CentralUser::firstOrCreate(
            ['email' => 'superadmin@ibigan.com'],
            [
                'name'           => 'Super Admin',
                'password'       => bcrypt('senha123'),
                'is_super_admin' => true,
                'is_active'      => true,
            ]
        );

        CentralUser::firstOrCreate(
            ['email' => 'raphaelacunhadasilva@gmail.com'],
            [
                'name'           => 'Raphael Acunha da Silva',
                'password'       => bcrypt('A12345'),
                'is_super_admin' => true,
                'is_active'      => true,
            ]
        );
    }
}
