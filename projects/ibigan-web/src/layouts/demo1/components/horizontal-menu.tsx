import { type ReactNode } from 'react';
import { ChevronDown, LayoutGrid } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { type MenuConfig, type MenuItem } from '@/config/types';
import { useCentralMenu } from '@/hooks/use-central-menu';
import { useDynamicMenu } from '@/hooks/use-dynamic-menu';
import { useHoverOpen } from '@/hooks/use-hover-open';
import {
  isMenuPathActive,
  menuGroupContainsActivePath,
} from '@/lib/menu-active-path';
import { MenuBadge } from '@/lib/menu-badge';
import {
  MENU_HORIZONTAL_DROPDOWN_ACTIVE_CLASS,
  MENU_HORIZONTAL_GROUP_ACTIVE_CLASS,
  MENU_HORIZONTAL_LEAF_ACTIVE_CLASS,
} from '@/lib/menu-nav-link-styles';
import { buildDevToolsHref, isDevToolsMenuPath } from '@/lib/dev-tools-link';
import { isExternalMenuPath, resolveMenuLinkTarget } from '@/lib/menu-link';
import { isNotificationPreferencesPath } from '@/lib/notification-preferences-path';
import { cn } from '@/lib/utils';
import { useNotificationPreferencesSheet } from '@/providers/notification-preferences-sheet-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const triggerBaseClass =
  'inline-flex items-center gap-1.5 rounded-md px-2.5 h-9 text-sm font-medium shadow-none border-0 outline-none focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=open]:ring-0';

const groupTriggerClass = (groupActive: boolean, open: boolean) =>
  cn(
    triggerBaseClass,
    groupActive
      ? MENU_HORIZONTAL_GROUP_ACTIVE_CLASS
      : 'text-secondary-foreground hover:bg-muted/50 hover:text-foreground',
    open && 'bg-muted/60 text-foreground',
  );

const leafTriggerClass = (active: boolean) =>
  cn(
    triggerBaseClass,
    active
      ? MENU_HORIZONTAL_LEAF_ACTIVE_CLASS
      : 'text-secondary-foreground hover:bg-muted/50 hover:text-foreground',
  );

const dropdownItemClass = (active: boolean) =>
  cn(
    'flex w-full items-center gap-2 rounded-md px-2 py-2 cursor-pointer text-sm transition-colors outline-none',
    active
      ? MENU_HORIZONTAL_DROPDOWN_ACTIVE_CLASS
      : 'text-foreground hover:bg-muted/50 hover:text-foreground',
  );

function MenuIcon({ icon: Icon }: { icon?: MenuItem['icon'] }) {
  const ResolvedIcon = Icon ?? LayoutGrid;
  return <ResolvedIcon className="size-4 shrink-0" />;
}

function HorizontalMenuLink({
  item,
  className,
  children,
}: {
  item: Pick<MenuItem, 'path' | 'target'>;
  className?: string;
  children: ReactNode;
}) {
  if (!item.path) {
    return null;
  }

  const linkTarget = resolveMenuLinkTarget(item.path, item.target);
  const href = isDevToolsMenuPath(item.path) ? buildDevToolsHref(item.path) : item.path;

  if (isExternalMenuPath(item.path)) {
    return (
      <a
        href={href}
        target={linkTarget}
        rel={linkTarget === '_blank' ? 'noopener noreferrer' : undefined}
        className={className}
      >
        {children}
      </a>
    );
  }

  return (
    <Link to={item.path} className={className}>
      {children}
    </Link>
  );
}

function DropdownChildItems({
  items,
  menu,
  pathname,
  isPathActive,
  onOpenPreferences,
}: {
  items: MenuItem[];
  menu: MenuItem[];
  pathname: string;
  isPathActive: (path: string | undefined) => boolean;
  onOpenPreferences: () => void;
}) {
  return items.map((child, childIndex) => {
    if (child.heading || child.disabled) return null;

    if (child.children?.length) {
      return (
        <DropdownMenuSub key={childIndex}>
          <DropdownMenuSubTrigger
            className={cn(
              menuGroupContainsActivePath(pathname, menu, child.children)
                && MENU_HORIZONTAL_GROUP_ACTIVE_CLASS,
            )}
          >
            <MenuIcon icon={child.icon} />
            <span className="grow">{child.title}</span>
            <MenuBadge badge={child.badge} />
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="min-w-48">
            <DropdownChildItems
              items={child.children}
              menu={menu}
              pathname={pathname}
              isPathActive={isPathActive}
              onOpenPreferences={onOpenPreferences}
            />
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      );
    }

    if (!child.path) return null;

    const active = isPathActive(child.path);

    if (isNotificationPreferencesPath(child.path)) {
      return (
        <DropdownMenuItem
          key={childIndex}
          className={cn('p-0 focus:bg-transparent', dropdownItemClass(active))}
          onClick={onOpenPreferences}
        >
          <MenuIcon icon={child.icon} />
          <span className="grow">{child.title}</span>
          <MenuBadge badge={child.badge} />
        </DropdownMenuItem>
      );
    }

    return (
      <DropdownMenuItem key={childIndex} asChild className="p-0 focus:bg-transparent">
        <HorizontalMenuLink item={child} className={dropdownItemClass(active)}>
          <MenuIcon icon={child.icon} />
          <span className="grow">{child.title}</span>
          <MenuBadge badge={child.badge} />
        </HorizontalMenuLink>
      </DropdownMenuItem>
    );
  });
}

function HorizontalMenuItem({
  item,
  index,
  menu,
  pathname,
}: {
  item: MenuItem;
  index: number;
  menu: MenuItem[];
  pathname: string;
}) {
  const { open: openPreferences, isOpen: preferencesOpen } = useNotificationPreferencesSheet();
  const { open, setOpen, hoverProps } = useHoverOpen();

  const isPathActive = (path: string | undefined) =>
    isMenuPathActive(pathname, path, menu)
    || (preferencesOpen && isNotificationPreferencesPath(path));

  if (item.heading || item.disabled) {
    return null;
  }

  const children = item.children?.filter((child) => !child.heading && !child.disabled);
  const groupActive = children?.length
    ? menuGroupContainsActivePath(pathname, menu, children)
    : false;

  if (children?.length) {
    return (
      <DropdownMenu key={index} open={open} onOpenChange={setOpen} modal={false}>
        <DropdownMenuTrigger asChild {...hoverProps}>
          <Button variant="ghost" className={groupTriggerClass(groupActive, open)}>
            <MenuIcon icon={item.icon} />
            {item.title}
            <MenuBadge badge={item.badge} />
            <ChevronDown className="size-3.5 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          sideOffset={8}
          className="min-w-52 p-2"
          {...hoverProps}
        >
          <DropdownChildItems
            items={children}
            menu={menu}
            pathname={pathname}
            isPathActive={isPathActive}
            onOpenPreferences={openPreferences}
          />
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (!item.path) {
    return null;
  }

  if (isNotificationPreferencesPath(item.path)) {
    return (
      <Button
        key={index}
        variant="ghost"
        className={leafTriggerClass(isPathActive(item.path))}
        onClick={openPreferences}
      >
        <MenuIcon icon={item.icon} />
        {item.title}
        <MenuBadge badge={item.badge} />
      </Button>
    );
  }

  return (
    <Button
      key={index}
      variant="ghost"
      className={leafTriggerClass(isPathActive(item.path))}
      asChild
    >
      <HorizontalMenuLink
        item={item}
        className="inline-flex items-center gap-1.5"
      >
        <MenuIcon icon={item.icon} />
        {item.title}
        <MenuBadge badge={item.badge} />
      </HorizontalMenuLink>
    </Button>
  );
}

type HorizontalMenuProps = {
  menuSource?: 'tenant' | 'central';
};

export function HorizontalMenu({ menuSource = 'tenant' }: HorizontalMenuProps) {
  const dynamicMenu = useDynamicMenu();
  const centralMenu = useCentralMenu();
  const menu: MenuConfig = menuSource === 'central' ? centralMenu : dynamicMenu;
  const { pathname } = useLocation();

  return (
    <div className="flex min-w-0 items-stretch">
      <nav className="flex list-none items-center gap-1">
        {menu.map((item, index) => (
          <HorizontalMenuItem
            key={index}
            item={item}
            index={index}
            menu={menu}
            pathname={pathname}
          />
        ))}
      </nav>
    </div>
  );
}
