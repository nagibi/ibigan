import { type ReactNode } from 'react';
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

export function MenuNavLink({
  path,
  className,
  onNavigate,
  children,
}: MenuNavLinkProps) {
  const { open } = useNotificationPreferencesSheet();

  if (isNotificationPreferencesPath(path)) {
    return (
      <button
        type="button"
        className={cn('flex w-full items-center gap-2 text-left', className)}
        onClick={() => {
          open();
          onNavigate?.();
        }}
      >
        {children}
      </button>
    );
  }

  return (
    <Link to={path || '#'} className={className} onClick={onNavigate}>
      {children}
    </Link>
  );
}
