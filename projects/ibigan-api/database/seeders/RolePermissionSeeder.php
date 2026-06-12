<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $permissions = [
            // Usuários
            'usuario-visualizar', 'usuario-gerenciar',
            // Convites
            'convite-visualizar', 'convite-gerenciar',
            // Aprovações
            'aprovacao-visualizar', 'aprovacao-gerenciar',
            // Empresas/Organizations
            'empresa-visualizar', 'empresa-gerenciar',
            // Campanhas
            'campanha-visualizar', 'campanha-gerenciar',
            // Templates
            'template-visualizar', 'template-gerenciar',
            // Relatórios
            'relatorio-visualizar', 'relatorio-gerenciar',
            // Webhooks
            'webhook-visualizar', 'webhook-gerenciar',
            // Menus
            'menu-visualizar', 'menu-gerenciar',
            // Notificações
            'notificacao-visualizar', 'notificacao-gerenciar',
            // Permissões
            'permissao-visualizar', 'permissao-gerenciar',
            // Activity Log
            'log-visualizar',
            // Documentação
            'doc-visualizar',
            // Configurações
            'configuracao-gerenciar',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'sanctum']);
        }

        // SUPER-ADMIN — tudo
        $superAdmin = Role::firstOrCreate(['name' => 'super-admin', 'guard_name' => 'sanctum']);
        $superAdmin->syncPermissions($permissions);

        // ADMIN — tudo exceto permissao-gerenciar
        $admin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'sanctum']);
        $admin->syncPermissions(
            array_filter($permissions, fn ($p) => $p !== 'permissao-gerenciar')
        );

        // MANAGER — gerenciar operacional, não gerencia infra
        $manager = Role::firstOrCreate(['name' => 'manager', 'guard_name' => 'sanctum']);
        $manager->syncPermissions([
            'usuario-visualizar', 'usuario-gerenciar',
            'convite-visualizar', 'convite-gerenciar',
            'aprovacao-visualizar', 'aprovacao-gerenciar',
            'campanha-visualizar', 'campanha-gerenciar',
            'template-visualizar', 'template-gerenciar',
            'relatorio-visualizar', 'relatorio-gerenciar',
            'notificacao-visualizar', 'notificacao-gerenciar',
            'empresa-visualizar',
            'log-visualizar',
        ]);

        // VIEWER — só visualizar
        $viewer = Role::firstOrCreate(['name' => 'viewer', 'guard_name' => 'sanctum']);
        $viewer->syncPermissions([
            'usuario-visualizar',
            'campanha-visualizar',
            'template-visualizar',
            'relatorio-visualizar',
            'notificacao-visualizar',
            'empresa-visualizar',
        ]);
    }
}
