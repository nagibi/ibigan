import { Megaphone, BarChart2, Building2, MessageSquare, ShieldCheck, Wrench } from 'lucide-react';
import { type MenuConfig } from './types';

export const CENTRAL_MENU_SIDEBAR: MenuConfig = [
  {
    heading: 'PLATAFORMA',
  },
  {
    title: 'Empresas',
    icon: Building2,
    path: '/admin/tenants',
  },
  {
    title: 'Super-admins',
    icon: ShieldCheck,
    path: '/admin/super-admins',
  },
  {
    heading: 'CATÁLOGO',
  },
  {
    title: 'Templates de mensagem',
    icon: MessageSquare,
    path: '/admin/message-templates',
  },
  {
    title: 'Relatórios padrão',
    icon: BarChart2,
    path: '/admin/reports',
  },
  {
    title: 'Campanhas',
    icon: Megaphone,
    path: '/admin/campaigns/new',
  },
  {
    heading: 'FERRAMENTAS',
  },
  {
    title: 'Ferramentas',
    icon: Wrench,
    path: '/admin/devtools',
  },
];
