import { useLocation } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useSettings } from '@/providers/settings-provider';
import { SidebarHeader } from './sidebar-header';
import { SidebarMenu } from './sidebar-menu';

export function Sidebar() {
  const { settings } = useSettings();
  const { resolvedTheme } = useTheme();
  const { pathname } = useLocation();
  const isDarkSidebar =
    settings.layouts.demo1.sidebarTheme === 'dark' ||
    resolvedTheme === 'dark' ||
    pathname.includes('dark-sidebar');

  return (
    <div
      className={cn(
        'sidebar bg-background lg:border-e lg:border-border lg:fixed lg:top-0 lg:bottom-0 lg:z-20 lg:flex flex-col items-stretch shrink-0',
        isDarkSidebar && 'dark',
      )}
    >
      <SidebarHeader />
      <div className="sidebar-wrapper flex min-h-0 grow overflow-hidden">
        <SidebarMenu />
      </div>
    </div>
  );
}
