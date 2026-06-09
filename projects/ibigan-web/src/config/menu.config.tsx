import {
  Activity,
  Bell,
  Building2,
  LayoutDashboard,
  Mail,
  Megaphone,
  Settings,
  Shield,
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
    title: 'Organizações',
    icon: Building2,
    path: '/organizations',
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
    heading: 'CONFIGURAÇÕES',
  },
  {
    title: 'Templates',
    icon: Mail,
    path: '/message-templates',
  },
  {
    title: 'Webhooks',
    icon: Webhook,
    path: '/webhooks',
  },
  {
    title: 'Notificações',
    icon: Bell,
    path: '/notifications',
  },
  {
    title: 'Configurações',
    icon: Settings,
    path: '/settings',
  },
  {
    title: 'Segurança',
    icon: Shield,
    path: '/security',
  },
  {
    title: 'Activity Log',
    icon: Activity,
    path: '/activity-logs',
  },
];

export const MENU_MEGA: MenuConfig = [];
export const MENU_MEGA_MOBILE: MenuConfig = [];
