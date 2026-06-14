import { LayoutDashboard } from 'lucide-react';
import { type MenuConfig } from '@/config/types';

export const CENTRAL_PLATFORM_MENU: MenuConfig = [
  {
    heading: 'PLATAFORMA',
  },
  {
    title: 'Painel central',
    icon: LayoutDashboard,
    path: '/admin/tenants',
  },
];

function stripSaasTenantsItem(menu: MenuConfig): MenuConfig {
  return menu.filter((item) => item.path !== '/admin/tenants');
}

/**
 * Exibe atalho para o painel central quando super-admin da plataforma está em um tenant.
 * Remove "Empresas" duplicado do bloco de administração.
 */
export function mergeCentralPlatformMenuItems(
  menu: MenuConfig,
  canAccessCentralFromTenant: boolean,
): MenuConfig {
  if (!canAccessCentralFromTenant) {
    return menu;
  }

  return [...CENTRAL_PLATFORM_MENU, ...stripSaasTenantsItem(menu)];
}
