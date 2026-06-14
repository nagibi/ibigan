import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Menu } from 'lucide-react';
import { useLocation } from 'react-router';
import { Link } from 'react-router-dom';
import { type MenuMode } from '@/config/types';
import { toAbsoluteUrl } from '@/lib/helpers';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSettings } from '@/providers/settings-provider';
import { NotificationsSheet } from '@/partials/topbar/notifications-sheet';
import { UserDropdownMenu } from '@/partials/topbar/user-dropdown-menu';
import { ToolbarTooltip } from '@/components/grid/toolbar-tooltip';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Container } from '@/components/common/container';
import { HorizontalMenu } from '@/layouts/demo1/components/horizontal-menu';
import { SidebarMenu } from '@/layouts/demo1/components/sidebar-menu';

export function CentralHeader() {
  const { t } = useTranslation();
  const [isSidebarSheetOpen, setIsSidebarSheetOpen] = useState(false);
  const { pathname } = useLocation();
  const mobileMode = useIsMobile();
  const { settings } = useSettings();
  const menuMode = (settings.layouts.demo1.menuMode ?? 'horizontal') as MenuMode;
  const isHorizontalMenu = menuMode === 'horizontal';

  useEffect(() => {
    setIsSidebarSheetOpen(false);
  }, [pathname]);

  return (
    <header className="header relative z-20 flex w-full shrink-0 items-stretch border-b border-border bg-background">
      <Container className="flex w-full grow items-stretch justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-stretch gap-5">
          <div className="flex items-center gap-2.5 lg:hidden">
            <Link to="/admin/tenants" className="shrink-0">
              <img
                src={toAbsoluteUrl('/media/app/mini-logo.svg')}
                className="h-[25px] w-full"
                alt="Ibigan"
              />
            </Link>
            {mobileMode ? (
              <Sheet open={isSidebarSheetOpen} onOpenChange={setIsSidebarSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" mode="icon">
                    <Menu className="text-muted-foreground/70" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="mobile-sidebar-sheet gap-0 p-0" side="left" close={false}>
                  <SheetHeader className="space-y-0 p-0" />
                  <SheetBody className="p-0">
                    <SidebarMenu menuSource="central" />
                  </SheetBody>
                </SheetContent>
              </Sheet>
            ) : null}
          </div>

          <Link to="/admin/tenants" className="hidden shrink-0 items-center lg:flex">
            <img
              src={toAbsoluteUrl('/media/app/mini-logo.svg')}
              className="h-[22px] max-w-none"
              alt="Ibigan"
            />
            <span className="ms-3 text-sm font-medium text-muted-foreground">
              Painel central
            </span>
          </Link>

          {isHorizontalMenu && !mobileMode ? (
            <div className="hidden min-w-0 flex-1 items-center overflow-hidden lg:flex">
              <HorizontalMenu menuSource="central" />
            </div>
          ) : null}
        </div>

        <div className="relative z-20 flex shrink-0 items-center gap-1 sm:gap-2 lg:gap-3">
          <NotificationsSheet
            trigger={
              <ToolbarTooltip content={t('header.tooltip.notifications')}>
                <Button
                  variant="ghost"
                  mode="icon"
                  shape="circle"
                  className="size-8 shrink-0 hover:bg-primary/10 hover:[&_svg]:text-primary sm:size-9"
                >
                  <Bell className="size-4 sm:size-4.5!" />
                </Button>
              </ToolbarTooltip>
            }
          />
          <UserDropdownMenu />
        </div>
      </Container>
    </header>
  );
}
