import { useEffect, useState } from 'react';
import { StoreClientTopbar } from '@/pages/store-client/components/common/topbar';
import { SearchDialog } from '@/partials/dialogs/search/search-dialog';
import { AppsDropdownMenu } from '@/partials/topbar/apps-dropdown-menu';
import { ChatSheet } from '@/partials/topbar/chat-sheet';
import { ImpersonationChip } from '@/partials/topbar/impersonation-chip';
import { NotificationsSheet } from '@/partials/topbar/notifications-sheet';
import { TenantSwitcher } from '@/partials/topbar/tenant-switcher';
import { UserDropdownMenu } from '@/partials/topbar/user-dropdown-menu';
import {
  Bell,
  LayoutGrid,
  Menu,
  MessageCircleMore,
  Search,
  SquareChevronRight,
} from 'lucide-react';
import { useLocation } from 'react-router';
import { Link } from 'react-router-dom';
import { toAbsoluteUrl } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import { type MenuMode } from '@/config/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSettings } from '@/providers/settings-provider';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Container } from '@/components/common/container';
import { Breadcrumb } from './breadcrumb';
import { HorizontalMenu } from './horizontal-menu';
import { MegaMenu } from './mega-menu';
import { MegaMenuMobile } from './mega-menu-mobile';
import { SidebarMenu } from './sidebar-menu';

export function Header() {
  const [isSidebarSheetOpen, setIsSidebarSheetOpen] = useState(false);
  const [isMegaMenuSheetOpen, setIsMegaMenuSheetOpen] = useState(false);

  const { pathname } = useLocation();
  const { settings } = useSettings();
  const mobileMode = useIsMobile();
  const menuMode = (settings.layouts.demo1.menuMode ?? 'horizontal') as MenuMode;
  const isHorizontalMenu = menuMode === 'horizontal';

  useEffect(() => {
    setIsSidebarSheetOpen(false);
    setIsMegaMenuSheetOpen(false);
  }, [pathname]);

  const showBreadcrumb = pathname.startsWith('/account');
  const showDesktopNav = !mobileMode && !showBreadcrumb;

  return (
    <header
      className={cn(
        'header fixed top-0 z-10 start-0 flex items-stretch shrink-0 border-b border-border bg-background end-0 pe-[var(--removed-body-scroll-bar-size,0px)]',
      )}
    >
      <Container className="flex w-full grow items-stretch justify-between gap-4">
        <div className="flex min-w-0 items-stretch gap-5">
          <div className="flex items-center gap-2.5 lg:hidden">
            <Link to="/" className="shrink-0">
              <img
                src={toAbsoluteUrl('/media/app/mini-logo.svg')}
                className="h-[25px] w-full"
                alt="mini-logo"
              />
            </Link>
            <div className="flex items-center">
              {mobileMode && (
                <Sheet
                  open={isSidebarSheetOpen}
                  onOpenChange={setIsSidebarSheetOpen}
                >
                  <SheetTrigger asChild>
                    <Button variant="ghost" mode="icon">
                      <Menu className="text-muted-foreground/70" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    className="p-0 gap-0 w-[275px]"
                    side="left"
                    close={false}
                  >
                    <SheetHeader className="p-0 space-y-0" />
                    <SheetBody className="p-0 overflow-y-auto">
                      <SidebarMenu />
                    </SheetBody>
                  </SheetContent>
                </Sheet>
              )}
              {mobileMode && !isHorizontalMenu && (
                <Sheet
                  open={isMegaMenuSheetOpen}
                  onOpenChange={setIsMegaMenuSheetOpen}
                >
                  <SheetTrigger asChild>
                    <Button variant="ghost" mode="icon">
                      <SquareChevronRight className="text-muted-foreground/70" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    className="p-0 gap-0 w-[275px]"
                    side="left"
                    close={false}
                  >
                    <SheetHeader className="p-0 space-y-0" />
                    <SheetBody className="p-0 overflow-y-auto">
                      <MegaMenuMobile />
                    </SheetBody>
                  </SheetContent>
                </Sheet>
              )}
            </div>
          </div>

          {isHorizontalMenu && !mobileMode && (
            <Link to="/" className="hidden shrink-0 items-center lg:flex">
              <img
                src={toAbsoluteUrl('/media/app/mini-logo.svg')}
                className="h-[22px] max-w-none"
                alt="Ibigan"
              />
            </Link>
          )}

          {showBreadcrumb ? (
            <Breadcrumb />
          ) : (
            showDesktopNav &&
            (isHorizontalMenu ? <HorizontalMenu /> : <MegaMenu />)
          )}
        </div>

        <div className="relative z-20 flex shrink-0 items-center gap-3">
          {pathname.startsWith('/store-client') ? (
            <StoreClientTopbar />
          ) : (
            <>
              {!mobileMode && (
                <SearchDialog
                  trigger={
                    <Button
                      variant="ghost"
                      mode="icon"
                      shape="circle"
                      className="size-9 hover:bg-primary/10 hover:[&_svg]:text-primary"
                    >
                      <Search className="size-4.5!" />
                    </Button>
                  }
                />
              )}
              <NotificationsSheet
                trigger={
                  <Button
                    variant="ghost"
                    mode="icon"
                    shape="circle"
                    className="size-9 hover:bg-primary/10 hover:[&_svg]:text-primary"
                  >
                    <Bell className="size-4.5!" />
                  </Button>
                }
              />
              <ChatSheet
                trigger={
                  <Button
                    variant="ghost"
                    mode="icon"
                    shape="circle"
                    className="size-9 hover:bg-primary/10 hover:[&_svg]:text-primary"
                  >
                    <MessageCircleMore className="size-4.5!" />
                  </Button>
                }
              />
              <AppsDropdownMenu
                trigger={
                  <Button
                    variant="ghost"
                    mode="icon"
                    shape="circle"
                    className="size-9 hover:bg-primary/10 hover:[&_svg]:text-primary"
                  >
                    <LayoutGrid className="size-4.5!" />
                  </Button>
                }
              />
              <div className="flex items-center gap-2">
                <ImpersonationChip />
                <TenantSwitcher />
                <UserDropdownMenu />
              </div>
            </>
          )}
        </div>
      </Container>
    </header>
  );
}
