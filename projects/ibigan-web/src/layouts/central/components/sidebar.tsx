import { useLocation } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useSettings } from '@/providers/settings-provider';
import { SidebarMenu } from '@/layouts/demo1/components/sidebar-menu';
import { CentralSidebarHeader } from './sidebar-header';

export function CentralSidebar() {
  const { settings } = useSettings();
  const { resolvedTheme } = useTheme();
  const { pathname } = useLocation();
  const isDarkSidebar =
    settings.layouts.demo1.sidebarTheme === 'dark' ||
    resolvedTheme === 'dark' ||
    pathname.includes('dark-sidebar');

  const isTransparent = settings.layouts.demo1.sidebarTransparent;

  return (
    <div
      className={cn(
        'sidebar lg:fixed lg:bottom-0 lg:top-0 lg:z-30 lg:flex lg:border-e lg:border-border flex shrink-0 flex-col items-stretch',
        isTransparent
          ? 'bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60'
          : 'bg-background',
        isDarkSidebar && 'dark',
      )}
    >
      <CentralSidebarHeader />
      <div className="sidebar-wrapper flex min-h-0 grow overflow-hidden">
        <SidebarMenu menuSource="central" />
      </div>
    </div>
  );
}
