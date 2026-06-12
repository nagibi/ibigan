import { forwardRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { isNotificationPreferencesPath } from '@/lib/notification-preferences-path';
import {
  isExternalMenuPath,
  resolveMenuLinkTarget,
  type MenuLinkTarget,
} from '@/lib/menu-link';
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
  const { open: openPreferences } = useNotificationPreferencesSheet();

  if (isNotificationPreferencesPath(path)) {
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type="button"
        className={cn('flex w-full items-center gap-2 text-left', className)}
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

  if (isExternalMenuPath(path)) {
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={path}
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
    <Link
      ref={ref as React.Ref<HTMLAnchorElement>}
      to={path || '#'}
      target={linkTarget === '_blank' ? '_blank' : undefined}
      rel={linkTarget === '_blank' ? 'noopener noreferrer' : undefined}
      className={className}
      onClick={onNavigate}
    >
      {children}
    </Link>
  );
});
