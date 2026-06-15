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
                    'cpf' => '15350946056',
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
                $user = $this->upsertAcmeSuperAdmin($admin);
                $user->syncRoles(['super-admin']);
                $catalogSyncUser ??= $user;
            }

            if ($catalogSyncUser !== null) {
                app(\App\Services\PlatformCatalogService::class)->sync($catalogSyncUser->id, force: true);
            }
        });
    }

    /**
     * @param  array{name: string, email: string, cpf: string}  $admin
     */
    private function upsertAcmeSuperAdmin(array $admin): User
    {
        $user = User::query()->firstOrNew(['email' => $admin['email']]);
        $isNew = ! $user->exists;

        $user->fill([
            'name' => $admin['name'],
            'phone' => '11987654321',
            'birth_date' => '1990-01-15',
            'gender' => 'prefer_not_to_say',
            'bio' => 'Super-admin do tenant Acme.',
            'status' => 'active',
            'is_super_admin' => true,
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

        return $user;
    }
}
