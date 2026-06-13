import { forwardRef, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { buildDevToolsHref, isDevToolsMenuPath } from '@/lib/dev-tools-link';
import { isNotificationPreferencesPath } from '@/lib/notification-preferences-path';
import {
  isExternalMenuPath,
  resolveMenuLinkTarget,
  type MenuLinkTarget,
} from '@/lib/menu-link';
import { MENU_NAV_LINK_ACTIVE_CLASS } from '@/lib/menu-nav-link-styles';
import { cn } from '@/lib/utils';
import { useNotificationPreferencesSheet } from '@/providers/notification-preferences-sheet-provider';

interface MenuNavLinkProps {
  path?: string;
  target?: MenuLinkTarget;
  className?: string;
  onNavigate?: () => void;
  children: ReactNode;
}

export const MenuNavLink = forwardRef<
  HTMLAnchorElement | HTMLButtonElement,
  MenuNavLinkProps
>(function MenuNavLink(
  { path, target, className, onNavigate, children },
  ref,
) {
  const { open: openPreferences, isOpen: preferencesOpen } = useNotificationPreferencesSheet();

  if (isNotificationPreferencesPath(path)) {
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type="button"
        className={cn(
          'flex w-full items-center gap-2 text-left',
          preferencesOpen && MENU_NAV_LINK_ACTIVE_CLASS,
          className,
        )}
        onClick={() => {
          openPreferences();
          onNavigate?.();
        }}
      >
        {children}
      </button>
    );
  }

  const linkTarget = resolveMenuLinkTarget(path, target);
  const href = path && isDevToolsMenuPath(path) ? buildDevToolsHref(path) : path;

  if (isExternalMenuPath(path)) {
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        target={linkTarget}
        rel={linkTarget === '_blank' ? 'noopener noreferrer' : undefined}
        className={className}
        onClick={onNavigate}
      >
        {children}
      </a>
    );
  }

  return (
    <NavLink
      ref={ref as React.Ref<HTMLAnchorElement>}
      to={path || '#'}
      end
      target={linkTarget === '_blank' ? '_blank' : undefined}
      rel={linkTarget === '_blank' ? 'noopener noreferrer' : undefined}
      className={({ isActive }) => cn(
        className,
        isActive && MENU_NAV_LINK_ACTIVE_CLASS,
      )}
      onClick={onNavigate}
    >
      {children}
    </NavLink>
  );
});
