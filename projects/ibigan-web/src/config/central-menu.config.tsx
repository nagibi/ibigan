import { Building2, ShieldCheck } from 'lucide-react';
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
];
