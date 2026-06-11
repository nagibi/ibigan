import { forwardRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { isNotificationPreferencesPath } from '@/lib/notification-preferences-path';
import { cn } from '@/lib/utils';
import { useNotificationPreferencesSheet } from '@/providers/notification-preferences-sheet-provider';

interface MenuNavLinkProps {
  path?: string;
  className?: string;
  onNavigate?: () => void;
  children: ReactNode;
}

export const MenuNavLink = forwardRef<
  HTMLAnchorElement | HTMLButtonElement,
  MenuNavLinkProps
>(function MenuNavLink({ path, className, onNavigate, children }, ref) {
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

  return (
    <Link
      ref={ref as React.Ref<HTMLAnchorElement>}
      to={path || '#'}
      className={className}
      onClick={onNavigate}
    >
      {children}
    </Link>
  );
});
