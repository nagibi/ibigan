import {
  History,
  BarChart2,
  Building2,
  FileBarChart,
  HardHat,
  LayoutDashboard,
  Mail,
  Megaphone,
  Menu,
  MessageSquare,
  Shield,
  ShieldCheck,
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
    title: 'Equipamentos',
    icon: HardHat,
    path: '/equipamentos',
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
    title: 'Histórico',
    icon: History,
    path: '/activity-logs',
  },
];

export const MENU_MEGA: MenuConfig = [];
export const MENU_MEGA_MOBILE: MenuConfig = [];
