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
            'roles' => ['admin', 'manager', 'viewer', 'operator', 'super-admin'],
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
            'roles' => ['admin', 'manager', 'viewer', 'operator', 'super-admin'],
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
            'roles' => ['admin', 'manager', 'operator', 'super-admin'],
        ]);

        Menu::create([
            'title' => 'Templates de Mensagem',
            'slug' => 'templates-mensagem',
            'icon' => 'MessageSquare',
            'path' => '/message-templates',
            'parent_id' => $gestao->id,
            'order' => 4,
            'is_active' => true,
            'requires_auth' => true,
            'roles' => ['admin', 'manager', 'viewer', 'operator', 'super-admin'],
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
            'roles' => ['admin', 'manager', 'viewer', 'operator', 'super-admin'],
        ]);

        Menu::create([
            'title' => 'Modelos de Relatório',
            'slug' => 'templates-relatorio',
            'icon' => 'BarChart2',
            'path' => '/reports',
            'parent_id' => $relatorios->id,
            'order' => 0,
            'is_active' => true,
            'requires_auth' => true,
            'roles' => ['admin', 'manager', 'viewer', 'operator', 'super-admin'],
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
            'roles' => ['admin', 'manager', 'viewer', 'operator', 'super-admin'],
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
            'title' => 'Funções',
            'slug' => 'funcoes',
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
            'roles' => ['admin', 'manager', 'viewer', 'operator', 'super-admin'],
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
            'roles' => ['admin', 'manager', 'viewer', 'operator', 'super-admin'],
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
            'roles' => ['admin', 'manager', 'viewer', 'operator', 'super-admin'],
        ]);

        // ── Ferramentas (dev) ─────────────────────────────────────
        $ferramentas = Menu::create([
            'title' => 'Ferramentas',
            'slug' => 'ferramentas',
            'icon' => 'Wrench',
            'path' => null,
            'order' => 5,
            'is_active' => true,
            'requires_auth' => true,
            'roles' => ['admin', 'super-admin'],
        ]);

        Menu::create([
            'title' => 'Documentação API',
            'slug' => 'documentacao-api',
            'icon' => 'BookOpen',
            'path' => config('dev-tools.api_docs_url'),
            'target' => '_blank',
            'parent_id' => $ferramentas->id,
            'order' => 0,
            'is_active' => true,
            'requires_auth' => true,
            'roles' => ['admin', 'super-admin'],
        ]);

        Menu::create([
            'title' => 'Horizon',
            'slug' => 'horizon',
            'icon' => 'Gauge',
            'path' => config('dev-tools.horizon_url'),
            'target' => '_blank',
            'parent_id' => $ferramentas->id,
            'order' => 1,
            'is_active' => true,
            'requires_auth' => true,
            'roles' => ['admin', 'super-admin'],
        ]);

        Menu::create([
            'title' => 'Telescope',
            'slug' => 'telescope',
            'icon' => 'Telescope',
            'path' => config('dev-tools.telescope_url'),
            'target' => '_blank',
            'parent_id' => $ferramentas->id,
            'order' => 2,
            'is_active' => true,
            'requires_auth' => true,
            'roles' => ['admin', 'super-admin'],
        ]);

        Menu::create([
            'title' => 'Clockwork',
            'slug' => 'clockwork',
            'icon' => 'Clock',
            'path' => config('dev-tools.clockwork_url'),
            'target' => '_blank',
            'parent_id' => $ferramentas->id,
            'order' => 3,
            'is_active' => true,
            'requires_auth' => true,
            'roles' => ['admin', 'super-admin'],
        ]);

        Menu::create([
            'title' => 'Log Viewer',
            'slug' => 'log-viewer',
            'icon' => 'ScrollText',
            'path' => config('dev-tools.log_viewer_url'),
            'target' => '_blank',
            'parent_id' => $ferramentas->id,
            'order' => 4,
            'is_active' => true,
            'requires_auth' => true,
            'roles' => ['admin', 'super-admin'],
        ]);

        Menu::create([
            'title' => 'phpMyAdmin',
            'slug' => 'phpmyadmin',
            'icon' => 'Database',
            'path' => config('dev-tools.phpmyadmin_url'),
            'target' => '_blank',
            'parent_id' => $ferramentas->id,
            'order' => 5,
            'is_active' => true,
            'requires_auth' => true,
            'roles' => ['admin', 'super-admin'],
        ]);

        Menu::create([
            'title' => 'Mailpit',
            'slug' => 'mailpit',
            'icon' => 'Mailbox',
            'path' => config('dev-tools.mailpit_url'),
            'target' => '_blank',
            'parent_id' => $ferramentas->id,
            'order' => 6,
            'is_active' => true,
            'requires_auth' => true,
            'roles' => ['admin', 'super-admin'],
        ]);

        // ── Configurações ─────────────────────────────────────────
        $configuracoes = Menu::create([
            'title' => 'Configurações',
            'slug' => 'configuracoes',
            'icon' => 'Settings',
            'path' => null,
            'order' => 6,
            'is_active' => true,
            'requires_auth' => true,
            'roles' => ['admin', 'super-admin'],
        ]);

        $translationKeys = [
            'dashboard' => 'menu.dashboard',
            'gestao' => 'menu.management',
            'usuarios' => 'menu.users',
            'aprovacoes' => 'menu.user_approvals',
            'convites' => 'menu.invites',
            'campanhas' => 'menu.campaigns',
            'templates-mensagem' => 'menu.message_templates',
            'relatorios-grupo' => 'menu.reports',
            'templates-relatorio' => 'menu.report_templates',
            'minhas-execucoes' => 'menu.my_executions',
            'administracao' => 'menu.administration',
            'empresas' => 'menu.tenants',
            'menus' => 'menu.menus',
            'funcoes' => 'menu.roles',
            'permissoes' => 'menu.permissions',
            'webhooks' => 'menu.webhooks',
            'activity-log' => 'menu.activity_log',
            'conta' => 'menu.account',
            'notificacoes' => 'menu.notifications',
            'meu-perfil' => 'menu.profile',
            'ferramentas' => 'menu.tools',
            'documentacao-api' => 'menu.api_docs',
            'horizon' => 'menu.horizon',
            'telescope' => 'menu.telescope',
            'clockwork' => 'menu.clockwork',
            'log-viewer' => 'menu.log_viewer',
            'phpmyadmin' => 'menu.phpmyadmin',
            'mailpit' => 'menu.mailpit',
            'configuracoes' => 'menu.settings',
        ];

        foreach ($translationKeys as $slug => $translationKey) {
            Menu::query()->where('slug', $slug)->update(['translation_key' => $translationKey]);
        }
    }
}
