<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Menu;
use Illuminate\Database\Seeder;

class MenuSeeder extends Seeder
{
    public function run(): void
    {
        Menu::query()->forceDelete();

        // ── Dashboard ─────────────────────────────────────────────
        Menu::create([
            'title' => 'Dashboard',
            'slug' => 'dashboard',
            'icon' => 'LayoutDashboard',
            'path' => '/dashboard',
            'order' => 0,
            'is_active' => true,
            'requires_auth' => true,
            'roles' => ['admin', 'manager', 'viewer', 'super-admin'],
        ]);

        // ── Gestão ────────────────────────────────────────────────
        $gestao = Menu::create([
            'title' => 'Gestão',
            'slug' => 'gestao',
            'icon' => null,
            'path' => null,
            'order' => 1,
            'is_active' => true,
            'requires_auth' => true,
            'roles' => ['admin', 'manager', 'viewer', 'super-admin'],
        ]);

        Menu::create([
            'title' => 'Usuários',
            'slug' => 'usuarios',
            'icon' => 'Users',
            'path' => '/users',
            'parent_id' => $gestao->id,
            'order' => 0,
            'is_active' => true,
            'requires_auth' => true,
            'roles' => ['admin', 'manager', 'viewer', 'super-admin'],
        ]);

        Menu::create([
            'title' => 'Aprovações',
            'slug' => 'aprovacoes',
            'icon' => 'UserCheck',
            'path' => '/user-approvals',
            'parent_id' => $gestao->id,
            'order' => 1,
            'is_active' => true,
            'requires_auth' => true,
            'roles' => ['admin', 'super-admin'],
        ]);

        Menu::create([
            'title' => 'Convites',
            'slug' => 'convites',
            'icon' => 'Mail',
            'path' => '/invites',
            'parent_id' => $gestao->id,
            'order' => 2,
            'is_active' => true,
            'requires_auth' => true,
            'roles' => ['admin', 'super-admin'],
        ]);

        Menu::create([
            'title' => 'Campanhas',
            'slug' => 'campanhas',
            'icon' => 'Megaphone',
            'path' => '/campaigns',
            'parent_id' => $gestao->id,
            'order' => 3,
            'is_active' => true,
            'requires_auth' => true,
            'roles' => ['admin', 'manager', 'super-admin'],
        ]);

        // ── Relatórios ────────────────────────────────────────────
        $relatorios = Menu::create([
            'title' => 'Relatórios',
            'slug' => 'relatorios-grupo',
            'icon' => null,
            'path' => null,
            'order' => 2,
            'is_active' => true,
            'requires_auth' => true,
            'roles' => ['admin', 'manager', 'viewer', 'super-admin'],
        ]);

        Menu::create([
            'title' => 'Relatórios',
            'slug' => 'relatorios',
            'icon' => 'BarChart2',
            'path' => '/reports',
            'parent_id' => $relatorios->id,
            'order' => 0,
            'is_active' => true,
            'requires_auth' => true,
            'roles' => ['admin', 'super-admin'],
        ]);

        Menu::create([
            'title' => 'Minhas Execuções',
            'slug' => 'minhas-execucoes',
            'icon' => 'FileBarChart',
            'path' => '/reports/executions',
            'parent_id' => $relatorios->id,
            'order' => 1,
            'is_active' => true,
            'requires_auth' => true,
            'roles' => ['admin', 'manager', 'viewer', 'super-admin'],
        ]);

        // ── Administração (tenant + SaaS) ─────────────────────────
        $administracao = Menu::create([
            'title' => 'Administração',
            'slug' => 'administracao',
            'icon' => null,
            'path' => null,
            'order' => 3,
            'is_active' => true,
            'requires_auth' => true,
            'roles' => ['admin', 'super-admin'],
        ]);

        Menu::create([
            'title' => 'Empresas',
            'slug' => 'empresas',
            'icon' => 'Building2',
            'path' => '/admin/tenants',
            'parent_id' => $administracao->id,
            'order' => 0,
            'is_active' => true,
            'requires_auth' => true,
            'roles' => ['super-admin'],
        ]);

        Menu::create([
            'title' => 'Menus',
            'slug' => 'menus',
            'icon' => 'Menu',
            'path' => '/menus',
            'parent_id' => $administracao->id,
            'order' => 1,
            'is_active' => true,
            'requires_auth' => true,
            'roles' => ['admin', 'super-admin'],
        ]);

        Menu::create([
            'title' => 'Papéis',
            'slug' => 'papeis',
            'icon' => 'ShieldCheck',
            'path' => '/roles',
            'parent_id' => $administracao->id,
            'order' => 2,
            'is_active' => true,
            'requires_auth' => true,
            'roles' => ['admin', 'super-admin'],
        ]);

        Menu::create([
            'title' => 'Permissões',
            'slug' => 'permissoes',
            'icon' => 'Shield',
            'path' => '/permissions',
            'parent_id' => $administracao->id,
            'order' => 3,
            'is_active' => true,
            'requires_auth' => true,
            'roles' => ['admin', 'super-admin'],
        ]);

        Menu::create([
            'title' => 'Webhooks',
            'slug' => 'webhooks',
            'icon' => 'Webhook',
            'path' => '/webhooks',
            'parent_id' => $administracao->id,
            'order' => 4,
            'is_active' => true,
            'requires_auth' => true,
            'roles' => ['admin', 'super-admin'],
        ]);

        Menu::create([
            'title' => 'Activity Log',
            'slug' => 'activity-log',
            'icon' => 'Activity',
            'path' => '/activity-logs',
            'parent_id' => $administracao->id,
            'order' => 5,
            'is_active' => true,
            'requires_auth' => true,
            'roles' => ['admin', 'super-admin'],
        ]);

        // ── Conta ─────────────────────────────────────────────────
        $conta = Menu::create([
            'title' => 'Conta',
            'slug' => 'conta',
            'icon' => 'User',
            'path' => null,
            'order' => 4,
            'is_active' => true,
            'requires_auth' => true,
            'roles' => ['admin', 'manager', 'viewer', 'super-admin'],
        ]);

        Menu::create([
            'title' => 'Notificações',
            'slug' => 'notificacoes',
            'icon' => 'Bell',
            'path' => '/notifications',
            'parent_id' => $conta->id,
            'order' => 0,
            'is_active' => true,
            'requires_auth' => true,
            'roles' => ['admin', 'manager', 'viewer', 'super-admin'],
        ]);

        Menu::create([
            'title' => 'Meu Perfil',
            'slug' => 'meu-perfil',
            'icon' => 'User',
            'path' => '/profile',
            'parent_id' => $conta->id,
            'order' => 1,
            'is_active' => true,
            'requires_auth' => true,
            'roles' => ['admin', 'manager', 'viewer', 'super-admin'],
        ]);
    }
}
