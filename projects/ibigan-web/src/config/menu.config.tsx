import {
  Activity,
  BarChart2,
  Bell,
  Building2,
  FileBarChart,
  LayoutDashboard,
  Mail,
  Megaphone,
  Menu,
  Settings2,
  Shield,
  ShieldCheck,
  User,
  UserCheck,
  Users,
  Webhook,
} from 'lucide-react';
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
    heading: 'RELATÓRIOS',
  },
  {
    title: 'Relatórios',
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
    title: 'Papéis',
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
    heading: 'CONTA',
  },
  {
    title: 'Meu perfil',
    icon: User,
    path: '/profile',
  },
  {
    title: 'Notificações',
    icon: Bell,
    path: '/notifications',
  },
  {
    title: 'Preferências',
    icon: Settings2,
    path: '/notification-preferences',
  },
  {
    title: 'Segurança',
    icon: Shield,
    path: '/security',
  },
];

export const MENU_MEGA: MenuConfig = [];
export const MENU_MEGA_MOBILE: MenuConfig = [];
