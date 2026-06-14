import type { ReactNode } from 'react';
import { useNotificationsUnreadCount } from '@/hooks/use-notifications-list';
import { useNotificationsSheet } from '@/providers/notifications-sheet-provider';
import { Badge } from '@/components/ui/badge';

export function NotificationsSheet({ trigger }: { trigger: ReactNode }) {
  const { open: openSheet, isOpen } = useNotificationsSheet();
  const unread = useNotificationsUnreadCount(isOpen);

  return (
    <div className="relative inline-flex cursor-pointer" onClick={openSheet}>
      {trigger}
      {unread > 0 && (
        <Badge
          variant="destructive"
          shape="circle"
          className="pointer-events-none absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-semibold leading-none"
        >
          {unread > 9 ? '9+' : unread}
        </Badge>
      )}
    </div>
  );
}
