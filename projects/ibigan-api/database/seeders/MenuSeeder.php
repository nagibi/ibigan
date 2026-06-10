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

        // ── Raiz ──────────────────────────────────────────────────
        Menu::create([
            'title' => 'Dashboard',
            'slug' => 'dashboard',
            'icon' => 'LayoutDashboard',
            'path' => '/dashboard',
            'order' => 0,
            'is_active' => true,
            'requires_auth' => true,
            'roles' => ['admin', 'manager', 'viewer'],
        ]);

        // ── GESTÃO (pessoas e comunicação) ────────────────────────
        $gestao = Menu::create([
            'title' => 'GESTÃO',
            'slug' => 'gestao',
            'icon' => null,
            'path' => null,
            'order' => 1,
            'is_active' => true,
            'requires_auth' => true,
            'roles' => ['admin', 'manager', 'viewer'],
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
            'roles' => ['admin', 'manager', 'viewer'],
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
            'roles' => ['admin'],
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
            'roles' => ['admin'],
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
            'roles' => ['admin', 'manager'],
        ]);

        Menu::create([
            'title' => 'Templates',
            'slug' => 'templates',
            'icon' => 'FileText',
            'path' => '/message-templates',
            'parent_id' => $gestao->id,
            'order' => 4,
            'is_active' => true,
            'requires_auth' => true,
            'roles' => ['admin'],
        ]);

        // ── RELATÓRIOS ────────────────────────────────────────────
        $relatorios = Menu::create([
            'title' => 'RELATÓRIOS',
            'slug' => 'relatorios-grupo',
            'icon' => null,
            'path' => null,
            'order' => 2,
            'is_active' => true,
            'requires_auth' => true,
            'roles' => ['admin', 'manager', 'viewer'],
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
            'roles' => ['admin'],
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
            'roles' => ['admin', 'manager', 'viewer'],
        ]);

        // ── ADMINISTRAÇÃO (config do tenant) ──────────────────────
        $admin = Menu::create([
            'title' => 'ADMINISTRAÇÃO',
            'slug' => 'administracao',
            'icon' => null,
            'path' => null,
            'order' => 3,
            'is_active' => true,
            'requires_auth' => true,
            'roles' => ['admin'],
        ]);

        Menu::create([
            'title' => 'Configurações',
            'slug' => 'settings',
            'icon' => 'Settings',
            'path' => '/settings',
            'parent_id' => $admin->id,
            'order' => 0,
            'is_active' => true,
            'requires_auth' => true,
            'roles' => ['admin'],
        ]);

        Menu::create([
            'title' => 'Webhooks',
            'slug' => 'webhooks',
            'icon' => 'Webhook',
            'path' => '/webhooks',
            'parent_id' => $admin->id,
            'order' => 1,
            'is_active' => true,
            'requires_auth' => true,
            'roles' => ['admin'],
        ]);

        Menu::create([
            'title' => 'Activity Log',
            'slug' => 'activity-log',
            'icon' => 'Activity',
            'path' => '/activity-logs',
            'parent_id' => $admin->id,
            'order' => 2,
            'is_active' => true,
            'requires_auth' => true,
            'roles' => ['admin'],
        ]);

        Menu::create([
            'title' => 'Menus',
            'slug' => 'menus',
            'icon' => 'Menu',
            'path' => '/menus',
            'parent_id' => $admin->id,
            'order' => 3,
            'is_active' => true,
            'requires_auth' => true,
            'roles' => ['admin'],
        ]);

        // ── CONTA (itens pessoais do usuário) ─────────────────────
        $conta = Menu::create([
            'title' => 'CONTA',
            'slug' => 'conta',
            'icon' => null,
            'path' => null,
            'order' => 4,
            'is_active' => true,
            'requires_auth' => true,
            'roles' => ['admin', 'manager', 'viewer'],
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
            'roles' => ['admin', 'manager', 'viewer'],
        ]);

        Menu::create([
            'title' => 'Segurança',
            'slug' => 'seguranca',
            'icon' => 'Shield',
            'path' => '/security',
            'parent_id' => $conta->id,
            'order' => 1,
            'is_active' => true,
            'requires_auth' => true,
            'roles' => ['admin', 'manager', 'viewer'],
        ]);
    }
}
