import { type ReactNode } from 'react';
import { ChevronDown, LayoutGrid } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { type MenuItem } from '@/config/types';
import { useDynamicMenu } from '@/hooks/use-dynamic-menu';
import { useHoverOpen } from '@/hooks/use-hover-open';
import { useMenu } from '@/hooks/use-menu';
import { MenuBadge } from '@/lib/menu-badge';
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

const triggerClass = (active: boolean) =>
  cn(
    'inline-flex items-center gap-1.5 rounded-md px-2.5 h-9 text-sm font-medium shadow-none',
    'border-0 outline-none focus-visible:ring-0 focus-visible:ring-offset-0',
    active
      ? 'bg-muted text-foreground'
      : 'text-secondary-foreground hover:bg-muted/50 hover:text-primary',
    'data-[state=open]:bg-muted data-[state=open]:text-foreground data-[state=open]:ring-0',
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

  if (isExternalMenuPath(item.path)) {
    return (
      <a
        href={item.path}
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
  isActive,
  hasActiveChild,
  onOpenPreferences,
}: {
  items: MenuItem[];
  isActive: (path: string | undefined) => boolean;
  hasActiveChild: (children: MenuItem[] | undefined) => boolean;
  onOpenPreferences: () => void;
}) {
  return items.map((child, childIndex) => {
    if (child.heading || child.disabled) return null;

    if (child.children?.length) {
      return (
        <DropdownMenuSub key={childIndex}>
          <DropdownMenuSubTrigger
            className={cn(
              hasActiveChild(child.children) && 'bg-accent text-foreground',
            )}
          >
            <MenuIcon icon={child.icon} />
            <span className="grow">{child.title}</span>
            <MenuBadge badge={child.badge} />
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="min-w-48">
            <DropdownChildItems
              items={child.children}
              isActive={isActive}
              hasActiveChild={hasActiveChild}
              onOpenPreferences={onOpenPreferences}
            />
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      );
    }

    if (!child.path) return null;

    const active = isActive(child.path);

    if (isNotificationPreferencesPath(child.path)) {
      return (
        <DropdownMenuItem
          key={childIndex}
          className={cn(
            'flex items-center gap-2 px-2 py-2 cursor-pointer',
            active && 'bg-accent text-primary font-medium',
          )}
          onClick={onOpenPreferences}
        >
          <MenuIcon icon={child.icon} />
          <span className="grow">{child.title}</span>
          <MenuBadge badge={child.badge} />
        </DropdownMenuItem>
      );
    }

    return (
      <DropdownMenuItem key={childIndex} asChild>
        <HorizontalMenuLink
          item={child}
          className={cn(
            'flex items-center gap-2 px-2 py-2 cursor-pointer',
            active && 'bg-accent text-primary font-medium',
          )}
        >
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
}: {
  item: MenuItem;
  index: number;
}) {
  const { pathname } = useLocation();
  const { isActive, hasActiveChild, isItemActive } = useMenu(pathname);
  const { open: openPreferences, isOpen: preferencesOpen } = useNotificationPreferencesSheet();
  const { open, setOpen, hoverProps } = useHoverOpen();
  const isActiveWithPreferences = (path: string | undefined) =>
    isActive(path) || (preferencesOpen && isNotificationPreferencesPath(path));

  if (item.heading || item.disabled) {
    return null;
  }

  const active = isItemActive(item);
  const children = item.children?.filter((child) => !child.heading && !child.disabled);

  if (children?.length) {
    return (
      <DropdownMenu key={index} open={open} onOpenChange={setOpen} modal={false}>
        <DropdownMenuTrigger asChild {...hoverProps}>
          <Button variant="ghost" className={triggerClass(active)}>
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
            isActive={isActiveWithPreferences}
            hasActiveChild={hasActiveChild}
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
        className={triggerClass(isActiveWithPreferences(item.path))}
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
      className={triggerClass(isActive(item.path))}
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

export function HorizontalMenu() {
  const menu = useDynamicMenu();

  return (
    <div className="flex min-w-0 items-stretch">
      <nav className="flex list-none items-center gap-1">
        {menu.map((item, index) => (
          <HorizontalMenuItem key={index} item={item} index={index} />
        ))}
      </nav>
    </div>
  );
}
