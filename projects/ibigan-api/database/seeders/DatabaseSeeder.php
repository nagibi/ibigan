<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Criar tenant de demonstração
        $tenant = Tenant::firstOrCreate(
            ['id' => 'acme'],
            ['slug' => 'acme']
        );

        // Criar usuário admin dentro do tenant
        $tenant->run(function () {
            User::firstOrCreate(
                ['email' => 'super@ibigan.com'],
                [
                    'name' => 'Super Admin',
                    'password' => Hash::make('A12345'),
                ]
            );
        });
    }
}
