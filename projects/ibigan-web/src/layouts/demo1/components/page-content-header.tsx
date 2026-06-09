import { Fragment } from 'react';
import { ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { MENU_SIDEBAR } from '@/config/menu.config';
import { useDynamicMenu } from '@/hooks/use-dynamic-menu';
import { useMenu } from '@/hooks/use-menu';
import { cn } from '@/lib/utils';
import { usePageToolbarConfig } from '@/providers/page-toolbar-provider';
import { Container } from '@/components/common/container';

function PageBreadcrumbs() {
  const { pathname } = useLocation();
  const menu = useDynamicMenu();
  const { getBreadcrumb, isActive } = useMenu(pathname);
  const items = getBreadcrumb(menu);

  if (items.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-2 flex items-center gap-1 text-xs font-medium lg:text-sm"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const active = item.path ? isActive(item.path) : false;

        return (
          <Fragment key={index}>
            {item.path && !isLast ? (
              <Link
                to={item.path}
                className={cn(
                  'text-muted-foreground hover:text-primary',
                  active && 'text-foreground',
                )}
              >
                {item.title}
              </Link>
            ) : (
              <span className={cn(isLast ? 'text-foreground' : 'text-muted-foreground')}>
                {item.title}
              </span>
            )}
            {!isLast && <ChevronRight className="size-3.5 text-muted-foreground" />}
          </Fragment>
        );
      })}
    </nav>
  );
}

export function PageContentHeader() {
  const config = usePageToolbarConfig();
  const { pathname } = useLocation();
  const menu = useDynamicMenu();
  const { getCurrentItem } = useMenu(pathname);
  const menuItem = getCurrentItem(menu) ?? getCurrentItem(MENU_SIDEBAR);

  const title = config?.title ?? menuItem?.title;
  const description = config?.description;

  if (!title && !description) {
    return (
      <Container className="pb-2 pt-4">
        <PageBreadcrumbs />
      </Container>
    );
  }

  return (
    <Container className="pb-3 pt-4">
      <PageBreadcrumbs />
      {title ? (
        <h1 className="text-xl font-semibold leading-tight text-foreground">{title}</h1>
      ) : null}
      {description ? (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      ) : null}
    </Container>
  );
}
