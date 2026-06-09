<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    private array $resources = [
        'usuario',
        'empresa',
        'menu',
        'relatorio',
        'permissao',
        'notificacao',
        'template',
        'campanha',
    ];

    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach ($this->resources as $resource) {
            Permission::firstOrCreate(['name' => "{$resource}-visualizar", 'guard_name' => 'sanctum']);
            Permission::firstOrCreate(['name' => "{$resource}-gerenciar", 'guard_name' => 'sanctum']);
        }

        $superAdmin = Role::firstOrCreate(['name' => 'super-admin', 'guard_name' => 'sanctum']);
        $admin = Role::firstOrCreate(['name' => 'admin',       'guard_name' => 'sanctum']);
        $manager = Role::firstOrCreate(['name' => 'manager',     'guard_name' => 'sanctum']);
        $viewer = Role::firstOrCreate(['name' => 'viewer',      'guard_name' => 'sanctum']);

        $superAdmin->syncPermissions(Permission::all());
        $admin->syncPermissions(Permission::where('name', '!=', 'permissao-gerenciar')->get());
        $manager->syncPermissions(
            Permission::whereIn('name', [
                'usuario-visualizar',
                'empresa-visualizar',
                'relatorio-visualizar',
                'relatorio-gerenciar',
                'notificacao-visualizar',
                'notificacao-gerenciar',
            ])->get()
        );
        $viewer->syncPermissions(
            Permission::where('name', 'like', '%-visualizar')
                ->where('name', '!=', 'campanha-visualizar')
                ->get()
        );
    }
}
