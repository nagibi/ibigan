import { Fragment } from 'react';
import { ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { MENU_SIDEBAR } from '@/config/menu.config';
import { type MenuConfig } from '@/config/types';
import { useCentralMenu } from '@/hooks/use-central-menu';
import { useDynamicMenu } from '@/hooks/use-dynamic-menu';
import { useMenu } from '@/hooks/use-menu';
import { buildPageBreadcrumbs, type PageBreadcrumbItem } from '@/lib/build-page-breadcrumbs';
import { usePageToolbarConfig } from '@/providers/page-toolbar-provider';
import { Container } from '@/components/common/container';

function BreadcrumbItemContent({ item }: { item: PageBreadcrumbItem }) {
  const Icon = item.icon;

  return (
    <span className="inline-flex items-center gap-1.5">
      {Icon ? <Icon className="size-3 shrink-0" aria-hidden="true" /> : null}
      {item.title}
    </span>
  );
}

function PageBreadcrumbs({ menu }: { menu: MenuConfig }) {
  const { pathname } = useLocation();
  const config = usePageToolbarConfig();
  const { getBreadcrumb } = useMenu(pathname);
  const items = buildPageBreadcrumbs({
    menuItems: getBreadcrumb(menu),
    pathname,
    pageTitle: config?.title,
    customItems: config?.breadcrumbs,
  });

  if (items.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-1 flex items-center gap-1 text-[0.6875rem] font-normal lg:text-xs"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <Fragment key={`${String(item.title)}-${index}`}>
            {isLast ? (
              <span className="text-muted-foreground">
                <BreadcrumbItemContent item={item} />
              </span>
            ) : item.path ? (
              <Link
                to={item.path}
                className="cursor-pointer text-secondary-foreground transition-colors hover:text-primary"
              >
                <BreadcrumbItemContent item={item} />
              </Link>
            ) : (
              <span className="text-secondary-foreground">
                <BreadcrumbItemContent item={item} />
              </span>
            )}
            {!isLast && <ChevronRight className="size-3 text-muted-foreground" />}
          </Fragment>
        );
      })}
    </nav>
  );
}

type PageContentHeaderProps = {
  menuSource?: 'tenant' | 'central';
  fallbackMenu?: MenuConfig;
};

export function PageContentHeader({
  menuSource = 'tenant',
  fallbackMenu = MENU_SIDEBAR,
}: PageContentHeaderProps) {
  const config = usePageToolbarConfig();
  const { pathname } = useLocation();
  const dynamicMenu = useDynamicMenu();
  const centralMenu = useCentralMenu();
  const menu = menuSource === 'central' ? centralMenu : dynamicMenu;
  const { getCurrentItem } = useMenu(pathname);
  const menuItem = getCurrentItem(menu) ?? getCurrentItem(fallbackMenu);

  const title = config?.title ?? menuItem?.title;
  const description = config?.description;

  if (!title && !description) {
    return (
      <Container className="pb-4 pt-3">
        <PageBreadcrumbs menu={menu} />
      </Container>
    );
  }

  return (
    <Container className="pb-4 pt-3">
      <PageBreadcrumbs menu={menu} />
      {title ? (
        <h1 className="font-medium text-lg text-mono">
          {title}
        </h1>
      ) : null}
      {description ? (
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      ) : null}
    </Container>
  );
}
