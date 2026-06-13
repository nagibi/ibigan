import {
  Activity,
  BarChart2,
  Bell,
  BookOpen,
  Building2,
  Database,
  FileBarChart,
  Gauge,
  LayoutDashboard,
  Mail,
  Mailbox,
  Megaphone,
  Menu,
  MessageSquare,
  Shield,
  ShieldCheck,
  User,
  UserCheck,
  Users,
  Webhook,
  Wrench,
} from 'lucide-react';
import { DEV_TOOLS_URLS } from '@/lib/dev-tools-urls';
import { type MenuConfig } from './types';

export const MENU_SIDEBAR: MenuConfig = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
  },
  {
    heading: 'GESTÃO',
  },
  {
    title: 'Usuários',
    icon: Users,
    path: '/users',
  },
  {
    title: 'Aprovações',
    icon: UserCheck,
    path: '/user-approvals',
  },
  {
    title: 'Convites',
    icon: Mail,
    path: '/invites',
  },
  {
    title: 'Campanhas',
    icon: Megaphone,
    path: '/campaigns',
  },
  {
    title: 'Templates de Mensagem',
    icon: MessageSquare,
    path: '/message-templates',
  },
  {
    heading: 'RELATÓRIOS',
  },
  {
    title: 'Modelos de Relatório',
    icon: BarChart2,
    path: '/reports',
  },
  {
    title: 'Minhas Execuções',
    icon: FileBarChart,
    path: '/reports/executions',
  },
  {
    heading: 'ADMINISTRAÇÃO',
  },
  {
    title: 'Empresas',
    icon: Building2,
    path: '/admin/tenants',
    superAdminOnly: true,
  },
  {
    title: 'Menus',
    icon: Menu,
    path: '/menus',
  },
  {
    title: 'Funções',
    icon: ShieldCheck,
    path: '/roles',
  },
  {
    title: 'Permissões',
    icon: Shield,
    path: '/permissions',
  },
  {
    title: 'Webhooks',
    icon: Webhook,
    path: '/webhooks',
  },
  {
    title: 'Activity Log',
    icon: Activity,
    path: '/activity-logs',
  },
  {
    title: 'Ferramentas',
    icon: Wrench,
    children: [
      {
        title: 'Documentação API',
        icon: BookOpen,
        path: DEV_TOOLS_URLS.apiDocs,
        target: '_blank',
      },
      {
        title: 'Horizon',
        icon: Gauge,
        path: DEV_TOOLS_URLS.horizon,
        target: '_blank',
      },
      {
        title: 'phpMyAdmin',
        icon: Database,
        path: DEV_TOOLS_URLS.phpMyAdmin,
        target: '_blank',
      },
      {
        title: 'Mailpit',
        icon: Mailbox,
        path: DEV_TOOLS_URLS.mailpit,
        target: '_blank',
      },
    ],
  },
  {
    title: 'Conta',
    icon: User,
    children: [
      {
        title: 'Notificações',
        icon: Bell,
        path: '/notifications',
      },
      {
        title: 'Meu Perfil',
        icon: User,
        path: '/profile',
      },
    ],
  },
];

export const MENU_MEGA: MenuConfig = [];
export const MENU_MEGA_MOBILE: MenuConfig = [];
