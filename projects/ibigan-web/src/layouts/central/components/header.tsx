import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import { useLocation } from 'react-router';
import { Link } from 'react-router-dom';
import { toAbsoluteUrl } from '@/lib/helpers';
import { useIsMobile } from '@/hooks/use-mobile';
import { UserDropdownMenu } from '@/partials/topbar/user-dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Container } from '@/components/common/container';
import { SidebarMenu } from '@/layouts/demo1/components/sidebar-menu';

export function CentralHeader() {
  const [isSidebarSheetOpen, setIsSidebarSheetOpen] = useState(false);
  const { pathname } = useLocation();
  const mobileMode = useIsMobile();

  useEffect(() => {
    setIsSidebarSheetOpen(false);
  }, [pathname]);

  return (
    <header className="header fixed top-0 z-10 start-0 flex shrink-0 items-stretch border-b border-border bg-background end-0 pe-[var(--removed-body-scroll-bar-size,0px)]">
      <Container className="flex w-full grow items-stretch justify-between gap-4">
        <div className="flex min-w-0 items-stretch gap-5">
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
                <SheetContent className="w-[275px] gap-0 p-0" side="left" close={false}>
                  <SheetHeader className="space-y-0 p-0" />
                  <SheetBody className="overflow-y-auto p-0">
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
        </div>

        <div className="relative z-20 flex shrink-0 items-center gap-3">
          <UserDropdownMenu />
        </div>
      </Container>
    </header>
  );
}
