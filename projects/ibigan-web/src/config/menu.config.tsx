import {
  Bell,
  Building2,
  LayoutDashboard,
  Mail,
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
];

export const MENU_MEGA: MenuConfig = [];
export const MENU_MEGA_MOBILE: MenuConfig = [];
