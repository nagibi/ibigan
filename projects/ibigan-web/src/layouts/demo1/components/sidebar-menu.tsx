'use client';

import { JSX, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { LayoutGrid, type LucideIcon } from 'lucide-react';
import { MenuConfig, MenuItem } from '@/config/types';
import { useCentralMenu } from '@/hooks/use-central-menu';
import { useDynamicMenu } from '@/hooks/use-dynamic-menu';
import { cn } from '@/lib/utils';
import { MENU_NAV_GROUP_SELECTED_CLASS } from '@/lib/menu-nav-link-styles';
import { findActiveMenuPath } from '@/lib/menu-active-path';
import {
  AccordionMenu,
  AccordionMenuClassNames,
  AccordionMenuGroup,
  AccordionMenuItem,
  AccordionMenuLabel,
  AccordionMenuSub,
  AccordionMenuSubContent,
  AccordionMenuSubTrigger,
} from '@/components/ui/accordion-menu';
import { Badge } from '@/components/ui/badge';
import { MenuNavLink } from '@/components/navigation/menu-nav-link';
import { MenuBadge } from '@/lib/menu-badge';
import { NOTIFICATION_PREFERENCES_PATH } from '@/lib/notification-preferences-path';
import { useNotificationPreferencesSheet } from '@/providers/notification-preferences-sheet-provider';

function menuGroupIsActive(item: MenuItem, activePath: string | null): boolean {
  if (!activePath) return false;
  if (item.path && (item.path === activePath || activePath.startsWith(`${item.path}/`))) {
    return true;
  }

  return item.children?.some((child) => menuGroupIsActive(child, activePath)) ?? false;
}

function isMenuItemActive(item: MenuItem, activePath: string | null): boolean {
  return Boolean(item.path && activePath && item.path === activePath);
}

function MenuIcon({ icon }: { icon?: LucideIcon }) {
  const Icon = icon ?? LayoutGrid;
  return <Icon data-slot="accordion-menu-icon" />;
}

type SidebarMenuProps = {
  menuSource?: 'tenant' | 'central';
};

export function SidebarMenu({ menuSource = 'tenant' }: SidebarMenuProps) {
  const dynamicMenu = useDynamicMenu();
  const centralMenu = useCentralMenu();
  const menu = menuSource === 'central' ? centralMenu : dynamicMenu;
  const { pathname } = useLocation();
  const { isOpen: preferencesOpen } = useNotificationPreferencesSheet();
  const selectedValue = preferencesOpen ? NOTIFICATION_PREFERENCES_PATH : pathname;

  const activeMenuPath = findActiveMenuPath(pathname, menu);

  const matchPath = useCallback(
    (path: string): boolean => Boolean(path && path === activeMenuPath),
    [activeMenuPath],
  );

  const selectedMenuClass = MENU_NAV_GROUP_SELECTED_CLASS;

  // Global classNames for consistent styling
  const classNames: AccordionMenuClassNames = {
    root: 'w-full min-w-0 max-w-full overflow-x-hidden lg:ps-1 space-y-3',
    group: 'gap-px w-full min-w-0 max-w-full',
    label:
      'uppercase text-xs font-medium text-muted-foreground/70 pt-2.25 pb-px',
    separator: '',
    item: cn(
      'relative h-8 hover:bg-transparent text-accent-foreground hover:text-primary',
      selectedMenuClass,
    ),
    sub: '',
    subTrigger: cn(
      'relative h-8 hover:bg-transparent text-accent-foreground hover:text-primary',
      selectedMenuClass,
    ),
    subContent: 'py-0',
    indicator: '',
  };

  const buildMenu = (items: MenuConfig): JSX.Element[] => {
    return items.map((item: MenuItem, index: number) => {
      if (item.heading) {
        return buildMenuHeading(item, index);
      } else if (item.disabled) {
        return buildMenuItemRootDisabled(item, index);
      } else {
        return buildMenuItemRoot(item, index);
      }
    });
  };

  const buildMenuItemRoot = (item: MenuItem, index: number): JSX.Element => {
    if (item.children) {
      return (
        <AccordionMenuSub key={index} value={item.path || `root-${index}`}>
          <AccordionMenuSubTrigger
            className="text-sm font-medium"
            data-selected={menuGroupIsActive(item, activeMenuPath) ? 'true' : undefined}
          >
            <MenuIcon icon={item.icon} />
            <span data-slot="accordion-menu-title">{item.title}</span>
            <MenuBadge badge={item.badge} className="ms-auto shrink-0" />
          </AccordionMenuSubTrigger>
          <AccordionMenuSubContent
            type="single"
            collapsible
            parentValue={item.path || `root-${index}`}
            className="ps-6"
          >
            <AccordionMenuGroup>
              {buildMenuItemChildren(item.children, 1)}
            </AccordionMenuGroup>
          </AccordionMenuSubContent>
        </AccordionMenuSub>
      );
    } else {
      const isActive = isMenuItemActive(item, activeMenuPath);

      return (
        <AccordionMenuItem
          key={index}
          value={item.path || ''}
          className="text-sm font-medium"
          selected={isActive}
          asChild
        >
          <MenuNavLink
            path={item.path}
            target={item.target}
            className="flex w-full min-w-0 max-w-full items-center gap-2"
          >
            <MenuIcon icon={item.icon} />
            <span data-slot="accordion-menu-title">{item.title}</span>
            <MenuBadge badge={item.badge} className="ms-auto shrink-0" />
          </MenuNavLink>
        </AccordionMenuItem>
      );
    }
  };

  const buildMenuItemRootDisabled = (
    item: MenuItem,
    index: number,
  ): JSX.Element => {
    return (
      <AccordionMenuItem
        key={index}
        value={`disabled-${index}`}
        className="text-sm font-medium"
      >
        <MenuIcon icon={item.icon} />
        <span data-slot="accordion-menu-title">{item.title}</span>
        {item.disabled && (
          <Badge variant="secondary" size="sm" className="ms-auto shrink-0">
            Soon
          </Badge>
        )}
      </AccordionMenuItem>
    );
  };

  const buildMenuItemChildren = (
    items: MenuConfig,
    level: number = 0,
  ): JSX.Element[] => {
    return items.map((item: MenuItem, index: number) => {
      if (item.disabled) {
        return buildMenuItemChildDisabled(item, index, level);
      } else {
        return buildMenuItemChild(item, index, level);
      }
    });
  };

  const buildMenuItemChild = (
    item: MenuItem,
    index: number,
    level: number = 0,
  ): JSX.Element => {
    if (item.children) {
      return (
        <AccordionMenuSub
          key={index}
          value={item.path || `child-${level}-${index}`}
        >
          <AccordionMenuSubTrigger
            className="text-[13px]"
            data-selected={menuGroupIsActive(item, activeMenuPath) ? 'true' : undefined}
          >
            {item.collapse ? (
              <span className="text-muted-foreground">
                <span className="hidden [[data-state=open]>span>&]:inline">
                  {item.collapseTitle}
                </span>
                <span className="inline [[data-state=open]>span>&]:hidden">
                  {item.expandTitle}
                </span>
              </span>
            ) : (
              <>
                <MenuIcon icon={item.icon} />
                <span data-slot="accordion-menu-title">{item.title}</span>
              </>
            )}
          </AccordionMenuSubTrigger>
          <AccordionMenuSubContent
            type="single"
            collapsible
            parentValue={item.path || `child-${level}-${index}`}
            className={cn(
              'ps-4',
              !item.collapse && 'relative',
              !item.collapse && (level > 0 ? '' : ''),
            )}
          >
            <AccordionMenuGroup>
              {buildMenuItemChildren(
                item.children,
                item.collapse ? level : level + 1,
              )}
            </AccordionMenuGroup>
          </AccordionMenuSubContent>
        </AccordionMenuSub>
      );
    } else {
      const isActive = isMenuItemActive(item, activeMenuPath);

      return (
        <AccordionMenuItem
          key={index}
          value={item.path || ''}
          className="text-[13px]"
          selected={isActive}
          asChild
        >
          <MenuNavLink
            path={item.path}
            target={item.target}
            className="flex w-full min-w-0 max-w-full items-center gap-2"
          >
            <MenuIcon icon={item.icon} />
            <span data-slot="accordion-menu-title">{item.title}</span>
            <MenuBadge badge={item.badge} className="ms-auto shrink-0" />
          </MenuNavLink>
        </AccordionMenuItem>
      );
    }
  };

  const buildMenuItemChildDisabled = (
    item: MenuItem,
    index: number,
    level: number = 0,
  ): JSX.Element => {
    return (
      <AccordionMenuItem
        key={index}
        value={`disabled-child-${level}-${index}`}
        className="text-[13px]"
      >
        <span data-slot="accordion-menu-title">{item.title}</span>
        {item.disabled && (
          <Badge variant="secondary" size="sm" className="ms-auto shrink-0">
            Soon
          </Badge>
        )}
      </AccordionMenuItem>
    );
  };

  const buildMenuHeading = (item: MenuItem, index: number): JSX.Element => {
    return <AccordionMenuLabel key={index}>{item.heading}</AccordionMenuLabel>;
  };

  return (
    <div className="sidebar-menu-scroll kt-scrollable-y-hover flex w-full min-w-0 max-w-full shrink-0 grow overflow-x-hidden py-5 px-5 lg:max-h-[calc(100vh-5.5rem)]">
      <AccordionMenu
        selectedValue={selectedValue}
        matchPath={matchPath}
        type="single"
        collapsible
        classNames={classNames}
      >
        {buildMenu(menu)}
      </AccordionMenu>
    </div>
  );
}
