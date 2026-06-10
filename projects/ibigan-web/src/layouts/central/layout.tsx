import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Outlet, useLocation } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { CENTRAL_MENU_SIDEBAR } from '@/config/central-menu.config';
import { type MenuMode } from '@/config/types';
import { useMenu } from '@/hooks/use-menu';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSettings } from '@/providers/settings-provider';
import {
  PageToolbarProvider,
  useClearPageToolbarAlertOnNavigate,
} from '@/providers/page-toolbar-provider';
import { Footer } from '@/layouts/demo1/components/footer';
import { PageContentHeader } from '@/layouts/demo1/components/page-content-header';
import { PageToolbarBar } from '@/layouts/demo1/components/page-toolbar-bar';
import { CentralHeader } from './components/header';
import { CentralSidebar } from './components/sidebar';

function CentralLayoutContent() {
  useClearPageToolbarAlertOnNavigate();

  return (
    <div className="wrapper flex grow flex-col">
      <CentralHeader />
      <PageToolbarBar />

      <main className="grow" role="content">
        <PageContentHeader
          menuSource="central"
          fallbackMenu={CENTRAL_MENU_SIDEBAR}
        />
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

export function CentralLayout() {
  const isMobile = useIsMobile();
  const { pathname } = useLocation();
  const { getCurrentItem } = useMenu(pathname);
  const item = getCurrentItem(CENTRAL_MENU_SIDEBAR);
  const { settings, setOption } = useSettings();
  const { resolvedTheme } = useTheme();

  const menuMode = (settings.layouts.demo1.menuMode ?? 'sidebar') as MenuMode;
  const isSidebarMode = menuMode !== 'horizontal';

  useEffect(() => {
    const bodyClass = document.body.classList;

    if (isSidebarMode && settings.layouts.demo1.sidebarCollapse) {
      bodyClass.add('sidebar-collapse');
    } else {
      bodyClass.remove('sidebar-collapse');
    }
  }, [settings.layouts.demo1.sidebarCollapse, isSidebarMode]);

  useEffect(() => {
    const bodyClass = document.body.classList;

    if (isSidebarMode && settings.layouts.demo1.sidebarTransparent) {
      bodyClass.add('sidebar-transparent');
    } else {
      bodyClass.remove('sidebar-transparent');
    }
  }, [settings.layouts.demo1.sidebarTransparent, isSidebarMode]);

  useEffect(() => {
    if (!resolvedTheme) return;
    const sidebarTheme = resolvedTheme === 'dark' ? 'dark' : 'light';
    if (settings.layouts.demo1.sidebarTheme !== sidebarTheme) {
      setOption('layouts.demo1.sidebarTheme', sidebarTheme);
    }
  }, [resolvedTheme, setOption, settings.layouts.demo1.sidebarTheme]);

  useEffect(() => {
    setOption('layout', 'demo1');
  }, [setOption]);

  useEffect(() => {
    const bodyClass = document.body.classList;

    bodyClass.add('demo1');
    bodyClass.add('header-fixed');

    if (isSidebarMode) {
      bodyClass.add('sidebar-fixed');
      bodyClass.remove('menu-horizontal');
    } else {
      bodyClass.remove('sidebar-fixed');
      bodyClass.remove('sidebar-collapse');
      bodyClass.add('menu-horizontal');
    }

    const timer = setTimeout(() => {
      bodyClass.add('layout-initialized');
    }, 300);

    return () => {
      bodyClass.remove('demo1');
      bodyClass.remove('sidebar-fixed');
      bodyClass.remove('sidebar-collapse');
      bodyClass.remove('sidebar-transparent');
      bodyClass.remove('menu-horizontal');
      bodyClass.remove('header-fixed');
      bodyClass.remove('layout-initialized');
      clearTimeout(timer);
    };
  }, [isSidebarMode]);

  return (
    <>
      <Helmet>
        <title>{item?.title ?? 'Painel central'}</title>
      </Helmet>

      {!isMobile && isSidebarMode ? <CentralSidebar /> : null}

      <PageToolbarProvider>
        <CentralLayoutContent />
      </PageToolbarProvider>
    </>
  );
}
