import { Building2, ShieldCheck, Wrench } from 'lucide-react';
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
    heading: 'FERRAMENTAS',
  },
  {
    title: 'Ferramentas',
    icon: Wrench,
    path: '/admin/devtools',
  },
];
